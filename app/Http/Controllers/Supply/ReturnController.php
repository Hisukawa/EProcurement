<?php

namespace App\Http\Controllers\Supply;

use App\Http\Controllers\Controller;
use App\Models\Disposed;
use App\Models\ICS;
use App\Models\ICSItems;
use App\Models\Inventory;
use App\Models\PAR;
use App\Models\PARItems;
use App\Models\PPESubMajorAccount;
use App\Models\Reissued;
use App\Models\ReissuedItems;
use App\Models\RIS;
use App\Models\RISItems;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReturnController extends Controller
{
public function generateRrspNumber()
{
    $year = date('y');  // Example: 25
    $month = date('m'); // Example: 10
    $prefix = "$year-$month-"; // Prefix: 25-10-

    // Get latest disposal RRSP
    $latestDisposed = DB::table('tbl_disposal')
        ->where('rrsp_number', 'like', "$prefix%")
        ->orderBy('rrsp_number', 'desc')
        ->value('rrsp_number');

    // Get latest reissued RRSP
    $latestReissued = DB::table('tbl_reissued')
        ->where('rrsp_number', 'like', "$prefix%")
        ->orderBy('rrsp_number', 'desc')
        ->value('rrsp_number');

    // Extract last serial numbers (e.g. 25-10-005 -> 5)
    $disposedSerial = $latestDisposed ? intval(substr($latestDisposed, -3)) : 0;
    $reissuedSerial = $latestReissued ? intval(substr($latestReissued, -3)) : 0;

    // Get the highest serial from both
    $latestSerial = max($disposedSerial, $reissuedSerial);

    // Increment for new serial
    $newSerial = str_pad($latestSerial + 1, 3, '0', STR_PAD_LEFT);

    // Return new RRSP number
    return $prefix . $newSerial;
}


public function returned_items(Request $request)
{
    $query = Reissued::with([ 'items','items.inventoryItem', 'items.reissuedBy',])
        ->latest();

    if ($request->filled('search')) {
        $search = $request->search;
        $query->whereHas('items.reissuedBy', function ($q) use ($search) {
            $q->where('firstname', 'like', "%{$search}%")
              ->orWhere('lastname', 'like', "%{$search}%");
        });
    }

    $record = $query->paginate(10)->appends($request->only('search'));

    return Inertia::render('Supply/ReturnedItems', [
        'records' => $record,
        'user' => Auth::user(),
        'filters' => $request->only('search'),
    ]);
}

public function disposed_items(Request $request)
{
    $query = Disposed::with(['items.inventoryItem', 'items.returnedBy'])
        ->latest();

    if ($request->filled('search')) {
        $search = $request->search;
        $query->whereHas('items.returnedBy', function ($q) use ($search) {
            $q->where('firstname', 'like', "%{$search}%")
              ->orWhere('lastname', 'like', "%{$search}%");
        })
        ->orWhereHas('items.inventoryItem', function ($q) use ($search) {
            $q->where('item_desc', 'like', "%{$search}%");
        });
    }

    $record = $query->paginate(10)->appends($request->only('search'));

    return Inertia::render('Supply/DisposedItems', [
        'records' => $record,
        'user' => Auth::user(),
        'filters' => $request->only('search'),
    ]);
}

public function return_form($type, $id)
{
    $selectedItems = array_filter(explode(',', request('items', '')));

    // Initialize record
    $record = null;;

    // Fetch the record based on type
    switch ($type) {
        case 'ris':
            $record = RIS::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'issuedBy',
                'items.reissuedItem',
                'items.disposedItem',
            ])->findOrFail($id);
            break;

        case 'ics':
            $record = ICS::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'receivedFrom',
                'items.reissuedItem',
                'items.disposedItem',
            ])->findOrFail($id);
            break;

        case 'par':
            $record = PAR::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'issuedBy',
                'items.reissuedItem',
                'items.disposedItem',
            ])->findOrFail($id);
            break;

        default:
            abort(404, 'Invalid type specified.');
    }

    $rrsp_number = $this->generateRrspNumber(); 

    $ppeOptions = PPESubMajorAccount::with('generalLedgerAccounts')->get();

    return inertia('Supply/ReturnForm', [
        'type' => $type,
        'record' => $record,
        'po_id' => $record->po->id ?? null,
        'user' => Auth::user(),
        'rrsp_number' => $rrsp_number,
        'ppe_options' => $ppeOptions,
        'selected_items' => $selectedItems, // Pass the generated RRSP number to the frontend
    ]);
}


public function submit_return(Request $request)
{
    $reissued_by = Auth::user()->id;
    $validated = $request->validate([
        'ics_number' => 'nullable|string',
        'date_reissued' => 'nullable|date',
        'remarks' => 'nullable|string',
        'items' => 'required|array',
        'items.*.inventory_item_id' => 'required|exists:tbl_inventory,id',
        'items.*.returned_by' => 'nullable|string',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.remarks' => 'nullable|string',
    ]);

    $rrsp_number = $this->generateRrspNumber();

    // Create the reissued record
    $reissued = Reissued::create([
        'rrsp_number' => $rrsp_number,
        'ics_number' => $validated['ics_number'] ?? null,
        'date_reissued' => $validated['date_reissued'] ?? null,
        'remarks' => $validated['remarks'] ?? null,
    ]);

    foreach ($validated['items'] as $itemData) {

        // Find the inventory item being returned
        $inventoryItem = Inventory::with('poDetail')->find($itemData['inventory_item_id']);

        if ($inventoryItem) {
            // 🧩 Find inventory by PO detail
            $existingInventory = Inventory::where('po_detail_id', $inventoryItem->po_detail_id)->first();

            if ($existingInventory) {
                // Add back to stock
                $existingInventory->total_stock += $itemData['quantity'];
                $existingInventory->save();
            } else {
                // Create new inventory entry
                Inventory::create([
                    'po_detail_id' => $inventoryItem->po_detail_id,
                    'total_stock' => $itemData['quantity'],
                    'status' => 'available',
                ]);
            }
        }

        // Create the reissued item
        $reissued->items()->create([
            'inventory_item_id' => $itemData['inventory_item_id'],
            'returned_by' => $itemData['returned_by'],
            'reissued_by' => $reissued_by,
            'quantity' => $itemData['quantity'],
            'remarks' => $itemData['remarks'] ?? null,
        ]);

        //-------------------------------------------------------
        //  🔽 DECREASE ISSUED QUANTITY IN RIS
        //-------------------------------------------------------
        $risItem = RISItems::where('inventory_item_id', $inventoryItem->id)
            ->whereNull('status') // only active issued items
            ->first();

        if ($risItem) {
            $risItem->quantity -= $itemData['quantity'];
            if ($risItem->quantity <= 0) {
                $risItem->quantity = 0;
                $risItem->status = 'reissued';
            }
            $risItem->save();
        }

        //-------------------------------------------------------
        //  🔽 DECREASE ISSUED QUANTITY IN ICS
        //-------------------------------------------------------
        $icsItem = ICSItems::where('inventory_item_id', $inventoryItem->id)
            ->whereNull('status')
            ->first();

        if ($icsItem) {
            $icsItem->quantity -= $itemData['quantity'];
            if ($icsItem->quantity <= 0) {
                $icsItem->quantity = 0;
                $icsItem->status = 'reissued';
            }
            $icsItem->save();
        }

        //-------------------------------------------------------
        //  🔽 DECREASE ISSUED QUANTITY IN PAR
        //-------------------------------------------------------
        $parItem = PARItems::where('inventory_item_id', $inventoryItem->id)
            ->whereNull('status')
            ->first();

        if ($parItem) {
            $parItem->quantity -= $itemData['quantity'];
            if ($parItem->quantity <= 0) {
                $parItem->quantity = 0;
                $parItem->status = 'reissued';
            }
            $parItem->save();
        }

        // Update original inventory item status
        $this->updateItemStatus($itemData['inventory_item_id'], 'reissued');
    }

    return redirect()->route('supply_officer.returned_items')
        ->with('success', 'Reissuance recorded and inventory updated successfully.');
}




public function disposal_form($type, $id)
{
    // Get selected item IDs (from ?items=1,2,3)
    $selectedItems = array_filter(explode(',', request('items', '')));

    // Initialize record
    $record = null;

    // Fetch record with relationships based on type
    switch ($type) {
        case 'ris':
            $record = RIS::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'issuedBy',
            'items.reissuedItem',
            'items.disposedItem',
            ])->findOrFail($id);
            break;

        case 'ics':
            $record = ICS::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'receivedFrom',
            'items.reissuedItem',
            'items.disposedItem',
            ])->findOrFail($id);
            break;

        case 'par':
            $record = PAR::with([
                'items.inventoryItem',
                'po.details.prDetail.purchaseRequest.focal_person',
                'requestedBy.division',
                'issuedBy',
            'items.reissuedItem',
            'items.disposedItem',
            ])->findOrFail($id);
            break;

        default:
            abort(404, 'Invalid type specified.');
    }

    // Generate a new RRSP number for this disposal
    $rrsp_number = $this->generateRrspNumber();

    // Load PPE options with related general ledger accounts
    $ppeOptions = PPESubMajorAccount::with('generalLedgerAccounts')->get();

    // Return to the Inertia view with all necessary data
    return inertia('Supply/DisposalForm', [
        'type' => $type,
        'record' => $record,
        'po_id' => $record->po->id ?? null,
        'user' => Auth::user(),
        'rrsp_number' => $rrsp_number,
        'ppe_options' => $ppeOptions,
        'selected_items' => $selectedItems, // IDs of items user selected in the Return modal
    ]);
}
public function submit_disposal(Request $request)
{
    $disposed_by = Auth::user()->id;

    $validated = $request->validate([
        'ics_number' => 'nullable|string',
        'date_disposed' => 'nullable|date',
        'items' => 'required|array',
        'items.*.inventory_item_id' => 'required|exists:tbl_inventory,id',
        'items.*.returned_by' => 'nullable|string',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.remarks' => 'nullable|string',
    ]);

    // Generate RRSP number by incrementing the last one in the disposed table
    $rrsp_number = $this->generateRrspNumber();

    $disposal = Disposed::create([
        'rrsp_number' => $rrsp_number,
        'ics_number' => $validated['ics_number'] ?? null,
        'date_disposed' => $validated['date_disposed'] ?? null,
    ]);

    foreach ($validated['items'] as $itemData) {
        $disposal->items()->create([
            'inventory_item_id' => $itemData['inventory_item_id'],
            'returned_by' => $itemData['returned_by'],
            'disposed_by' => $disposed_by,
            'quantity' => $itemData['quantity'],
            'remarks' => $itemData['remarks'] ?? null,
        ]);

        // Update the status to "returned_for_disposal" in the corresponding RIS/ICS/PAR record
        $this->updateItemStatus($itemData['inventory_item_id'], 'disposed');
    }

    return redirect()->route('supply_officer.disposed_items')->with('success', 'Disposal recorded successfully.');
}


private function updateItemStatus($inventoryItemId, $status)
{
    // Update the status of the item within the RIS/ICS/PAR records
    $risItem = RIS::whereHas('items', function ($query) use ($inventoryItemId) {
        $query->where('inventory_item_id', $inventoryItemId);
    })->first();

    $icsItem = ICS::whereHas('items', function ($query) use ($inventoryItemId) {
        $query->where('inventory_item_id', $inventoryItemId);
    })->first();

    $parItem = PAR::whereHas('items', function ($query) use ($inventoryItemId) {
        $query->where('inventory_item_id', $inventoryItemId);
    })->first();

    // Update the status of the item in RIS
    if ($risItem) {
        $item = $risItem->items()->where('inventory_item_id', $inventoryItemId)->first();
        if ($item) {
            $item->status = $status; // Update status field
            $item->save();
        }
    }

    // Update the status of the item in ICS
    if ($icsItem) {
        $item = $icsItem->items()->where('inventory_item_id', $inventoryItemId)->first();
        if ($item) {
            $item->status = $status; // Update status field
            $item->save();
        }
    }

    // Update the status of the item in PAR
    if ($parItem) {
        $item = $parItem->items()->where('inventory_item_id', $inventoryItemId)->first();
        if ($item) {
            $item->status = $status; // Update status field
            $item->save();
        }
    }
}

public function print_disposed_items($id)
{
    $record = Disposed::with('items.inventoryItem', 'items.returnedBy')->findOrFail($id);
    $pdf = Pdf::loadView('pdf.print_disposed', ['diposedItemData' => $record])
            ->setPaper('A4', 'portrait'); 
    

    return $pdf->stream('DISPOSED-ITEMS-'.$record->rrsp_number.'.pdf');

}

public function print_reissued_items($id)
{
    $record = Reissued::with('items.inventoryItem', 'items.returnedBy')->findOrFail($id);

    $pdf = Pdf::loadView('pdf.print_reissued', ['reissuedItemData' => $record])
            ->setPaper('A4', 'portrait'); 
            
    return $pdf->stream('REISSUED-ITEMS-'.$record->rrsp_number.'.pdf');

}

public function updateReissuedItem(Request $request, $id)
{
    $validated = $request->validate([
        'recipient' => 'nullable|string|max:255',
        'remarks' => 'nullable|string|max:1000',
    ]);

    $item = ReissuedItems::findOrFail($id);
    $item->update($validated);

    return back()->with('success', 'Reissued item updated successfully.');
}

}
