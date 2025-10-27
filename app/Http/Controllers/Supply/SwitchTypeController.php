<?php

namespace App\Http\Controllers\Supply;

use App\Http\Controllers\Controller;
use App\Models\ICS;
use App\Models\Inventory;
use App\Models\PAR;
use App\Models\PPESubMajorAccount;
use App\Models\PurchaseOrder;
use App\Models\RIS;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Svg\Tag\Rect;

class SwitchTypeController extends Controller
{

public function switchType(Request $request, $type, $id)
{
    $record = null;

    // Fetch the record based on type
    switch ($type) {
        case 'ris':
            $record = RIS::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'issuedBy'
            ])->findOrFail($id);
            break;

        case 'ics':
            $record = ICS::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'receivedFrom'
            ])->findOrFail($id);
            break;

        case 'par':
            $record = PAR::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'issuedBy'
            ])->findOrFail($id);
            break;

        default:
            abort(404, 'Invalid type');
    }

    // ✅ Get selected item IDs from query
    $selectedItemIds = $request->input('items', []);

    // ✅ If there are selected items, only keep those in the record
    if (!empty($selectedItemIds)) {
        $record->setRelation(
            'items',
            $record->items->whereIn('id', $selectedItemIds)->values()
        );
    }

    // PPE account options
    $ppeOptions = PPESubMajorAccount::with('generalLedgerAccounts')->get();

    return inertia('Supply/SwitchType', [
        'type' => $type,
        'record' => $record,
        'po_id' => optional($record->po)->id,
        'ppeOptions' => $ppeOptions,
        'user' => Auth::user(),
        'selectedItems' => $selectedItemIds, // optional, if you need to reuse them on front-end
    ]);
}


public function switchToRis(Request $request)
{
    $validated = $request->validate([
        'type' => 'required|string|in:ics,par',
        'id' => 'required|integer',
        'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
        'requested_by' => 'required|integer|exists:users,id',
        'issued_by' => 'required|integer|exists:users,id',
        'remarks' => 'nullable|string|max:255',
        'items' => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.unit_cost' => 'required|numeric|min:0.01',
        'items.*.total_cost' => 'required|numeric|min:0.01',
        'items.*.quantity' => 'required|numeric|min:0.01',
    ]);

    DB::beginTransaction();
    try {
        $po = PurchaseOrder::findOrFail($validated['po_id']);
        $sourceType = $validated['type'];
        $sourceId = $validated['id'];

        // Fetch source record with items
        $sourceModel = $sourceType === 'ics' ? ICS::class : PAR::class;
        $sourceRecord = $sourceModel::with('items')->findOrFail($sourceId);

        // Create RIS
        $ris = RIS::firstOrCreate(
            ['po_id' => $po->id],
            [
                'ris_number' => $po->po_number,
                'requested_by' => $validated['requested_by'],
                'issued_by' => $validated['issued_by'],
                'remarks' => $validated['remarks'] ?? null,
            ]
        );

        $inventoryIds = collect($validated['items'])->pluck('inventory_item_id')->toArray();

        // Create new items in RIS and delete from old type
        foreach ($validated['items'] as $item) {
            $ris->items()->create([
                'inventory_item_id' => $item['inventory_item_id'],
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'total_cost' => $item['total_cost'],
                'switch_type' => 'ris',
                'switched_by' => Auth::id(),
            ]);
        }

        // Delete moved items from old type
        $sourceRecord->items()->whereIn('inventory_item_id', $inventoryIds)->delete();

        DB::commit();
        return redirect()->route('supply_officer.ris_issuance')
            ->with('success', 'Selected items successfully switched to RIS and removed from previous record.');
    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Failed to switch to RIS. ' . $e->getMessage()]);
    }
}
public function switchToIcs(Request $request)
{
    $validated = $request->validate([
        'type' => 'required|string|in:ris,par',
        'id' => 'required|integer',
        'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
        'ics_number' => 'required|string|max:20',
        'requested_by' => 'required|integer|exists:users,id',
        'received_from' => 'required|integer|exists:users,id',
        'remarks' => 'nullable|string|max:255',

        'items' => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.inventory_item_number' => 'required|string|max:50',
        'items.*.ppe_sub_major_account' => 'required|string|max:100',
        'items.*.general_ledger_account' => 'required|string|max:100',
        'items.*.series_number' => 'nullable|string|max:100',
        'items.*.office' => 'nullable|string|max:100',
        'items.*.school' => 'nullable|string|max:100',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.unit_cost' => 'required|numeric|min:0.01',
        'items.*.total_cost' => 'required|numeric|min:0.01',
    ]);

DB::beginTransaction();
try {
    $po = PurchaseOrder::findOrFail($validated['po_id']);
    $sourceType = $validated['type'];
    $sourceId = $validated['id'];

    $sourceModel = $sourceType === 'ris' ? RIS::class : PAR::class;
    $sourceRecord = $sourceModel::with('items')->findOrFail($sourceId);

    // ✅ Create or update ICS record ONCE, not per item
    $ics = ICS::updateOrCreate(
        ['ics_number' => $validated['ics_number']],
        [
            'po_id' => $po->id,
            'requested_by' => $validated['requested_by'],
            'received_from' => $validated['received_from'],
            'remarks' => $validated['remarks'] ?? null,
        ]
    );

    $inventoryIds = [];

    foreach ($validated['items'] as $item) {
        $itemType = $item['unit_cost'] <= 5000 ? 'low' : 'high';

        // ✅ Each item now safely tied to same $ics record
        $ics->items()->create([
            'inventory_item_id' => $item['inventory_item_id'],
            'inventory_item_number' => $item['inventory_item_number'],
            'ppe_sub_major_account' => $item['ppe_sub_major_account'],
            'general_ledger_account' => $item['general_ledger_account'],
            'series_number' => $item['series_number'] ?? null,
            'office' => $item['office'] ?? null,
            'school' => $item['school'] ?? null,
            'quantity' => $item['quantity'],
            'unit_cost' => $item['unit_cost'],
            'total_cost' => $item['total_cost'],
            'type' => $itemType,
            'switch_type' => 'ics',
            'switched_by' => Auth::id(),
        ]);

        $inventoryIds[] = $item['inventory_item_id'];
    }

    // ✅ Remove transferred items from source record
    $sourceRecord->items()->whereIn('inventory_item_id', $inventoryIds)->delete();

    DB::commit();

    return redirect()->route('supply_officer.ics_issuance_low')
        ->with('success', 'Selected items successfully switched to ICS and removed from previous record.');
} catch (\Exception $e) {
    DB::rollBack();
    return back()->withErrors(['error' => 'Failed to switch to ICS. ' . $e->getMessage()]);
}

}



public function switchToPar(Request $request)
{
    $validated = $request->validate([
        'type' => 'required|string|in:ris,ics',
        'id' => 'required|integer',
        'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
        'par_number' => 'required|string|max:20',
        'requested_by' => 'required|integer|exists:users,id',
        'issued_by' => 'required|integer|exists:users,id',
        'remarks' => 'nullable|string|max:255',

        'items' => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.inventory_item_number' => 'required|string|max:50',
        'items.*.ppe_sub_major_account' => 'required|string|max:100',
        'items.*.general_ledger_account' => 'required|string|max:100',
        'items.*.series_number' => 'nullable|string|max:100',
        'items.*.office' => 'nullable|string|max:100',
        'items.*.school' => 'nullable|string|max:100',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.unit_cost' => 'required|numeric|min:0.01',
        'items.*.total_cost' => 'required|numeric|min:0.01',
    ]);

    DB::beginTransaction();

    try {
        $po = PurchaseOrder::findOrFail($validated['po_id']);
        $sourceType = $validated['type'];
        $sourceId = $validated['id'];

        // RIS ➜ PAR or ICS ➜ PAR
        $sourceModel = $sourceType === 'ris' ? RIS::class : ICS::class;
        $sourceRecord = $sourceModel::with('items')->findOrFail($sourceId);

        // ✅ Create or update PAR record ONCE, not per item
        $par = PAR::updateOrCreate(
            ['par_number' => $validated['par_number']], // condition
            [
                'po_id' => $po->id,
                'requested_by' => $validated['requested_by'],
                'issued_by' => $validated['issued_by'],
                'remarks' => $validated['remarks'] ?? null,
            ]
        );

        $inventoryIds = [];

        foreach ($validated['items'] as $item) {
            $itemType = $item['unit_cost'] <= 5000 ? 'low' : 'high';

            // ✅ Each item safely tied to same $par record
            $par->items()->create([
                'inventory_item_id' => $item['inventory_item_id'],
                'inventory_item_number' => $item['inventory_item_number'],
                'ppe_sub_major_account' => $item['ppe_sub_major_account'],
                'general_ledger_account' => $item['general_ledger_account'],
                'series_number' => $item['series_number'] ?? null,
                'office' => $item['office'] ?? null,
                'school' => $item['school'] ?? null,
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'total_cost' => $item['total_cost'],
                'type' => $itemType,
                'switch_type' => 'par',
                'switched_by' => Auth::id(),
                'property_number' => $item['inventory_item_number'],
            ]);

            $inventoryIds[] = $item['inventory_item_id'];
        }

        // ✅ Remove transferred items from source record
        $sourceRecord->items()->whereIn('inventory_item_id', $inventoryIds)->delete();

        DB::commit();

        return redirect()->route('supply_officer.par_issuance')
            ->with('success', 'Selected items successfully switched to PAR and removed from previous record.');
    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Failed to switch to PAR. ' . $e->getMessage()]);
    }
}


}
