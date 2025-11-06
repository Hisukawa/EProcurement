<?php

namespace App\Http\Controllers\Supply;

use App\Http\Controllers\Controller;
use App\Models\IAR;
use App\Models\Inventory;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeliveryReceiptsController extends Controller
{
    public function delivery_receipts(Request $request)
{
    $search = $request->input('search');
    $status = $request->input('status');
    $dateReceived = $request->input('date_received');

    $inventory = Inventory::with([
        'recordedBy',
        'unit',
        'requestedBy',
        'poDetail.purchaseOrder.supplier', // ✅ load purchase order & supplier
        'poDetail.prDetail.product',
    ])->latest('created_at')->when($search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
            $q->where('item_desc', 'like', "%$search%")
              ->orWhereHas('requestedBy', function ($subQuery) use ($search) {
                  $subQuery->where('firstname', 'like', "%$search%")
                           ->orWhere('lastname', 'like', "%$search%");
              });
        });
    })
    ->when($status, fn($q) => $q->where('status', $status))
    ->when($dateReceived, fn($q) => $q->whereDate('date_received', $dateReceived))
    ->where('source_type', 'central')
    ->paginate(10)
    ->withQueryString();
    $unit = Unit::select('id', 'unit')->get();
    return Inertia::render('Supply/DeliveryReceipts', [
        'inventoryData' => $inventory,
        'units' => $unit,
        'filters' => [
            'search' => $search,
            'status' => $status,
            'date_received' => $dateReceived,
        ],
    ]);
}

public function store_central_delivery(Request $request)
{
    // ✅ Validation
    $validated = $request->validate([
        'dr_number'     => 'required|string|max:20',
        'dr_date'       => 'required|date',
        'quantity'      => 'required|numeric|min:1',
        'unit_id'       => 'nullable|exists:tbl_units,id',
        'custom_unit'   => 'nullable|string|max:50',
        'item_desc'     => 'required|string|max:255',
        'unit_price'    => 'required|numeric|min:0',
        'remarks'       => 'nullable|string|max:255',
    ]);

    $userId = Auth::id();

    // ✅ Handle unit (find or create if custom)
    if (empty($validated['unit_id']) && !empty($validated['custom_unit'])) {
        $unit = Unit::firstOrCreate(['unit' => $validated['custom_unit']]);
        $validated['unit_id'] = $unit->id;
    } else {
        $unit = Unit::find($validated['unit_id']);
    }

    // ✅ Compute total price
    $totalPrice = $validated['quantity'] * $validated['unit_price'];

    // ✅ Save to IAR table (central)
    $iar = IAR::create([
        'po_id'                   => null,  // Not from a PO
        'iar_number'              => $validated['dr_number'], // Use DR number as reference
        'specs'                   => $validated['item_desc'],
        'quantity_ordered'        => $validated['quantity'],
        'quantity_received'       => $validated['quantity'],
        'unit_id'                    => $unit?->id,
        'unit_price'              => $validated['unit_price'],
        'total_price'             => $totalPrice,
        'remarks'                 => $validated['remarks'] ?? null,
        'inspection_committee_id' => null,
        'date_received'           => $validated['dr_date'],
        'recorded_by'             => $userId,
        'source_type'             => 'central',
    ]);

    // ✅ Save to Inventory
    Inventory::create([
        'po_detail_id'  => null, // Not tied to PO
        'iar_id'        => $iar->id,
        'dr_number'     => $validated['dr_number'],
        'dr_date'       => $validated['dr_date'],
        'recorded_by'   => $userId,
        'requested_by'  => null,
        'quantity'      => $validated['quantity'],
        'unit_id'       => $unit?->id,
        'unit_cost'     => $validated['unit_price'],
        'last_received' => $validated['dr_date'],
        'status'        => 'Available',
        'item_desc'     => $validated['item_desc'],
        'total_stock'   => $validated['quantity'],
        'source_type'   => 'central',
    ]);

    return back()->with('success', 'Delivery Receipt successfully recorded to IAR and Inventory.');
}

}
