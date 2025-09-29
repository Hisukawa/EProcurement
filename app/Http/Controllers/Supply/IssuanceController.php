<?php

namespace App\Http\Controllers\Supply;

use App\Exports\RISExport;
use App\Exports\RISExportMonthly;
use App\Http\Controllers\Controller;
use App\Models\ICS;
use App\Models\Inventory;
use App\Models\PAR;
use App\Models\PPESubMajorAccount;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use App\Models\RIS;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class IssuanceController extends Controller
{
public function issuance($po_detail_id, $inventory_id)
{
    $inventoryItem = Inventory::findOrFail($inventory_id);

    $poDetail = PurchaseOrderDetail::with([
        'purchaseOrder.supplier',
        'purchaseOrder.details.prDetail.product.category',
        'purchaseOrder.details.prDetail.product.unit',
        'purchaseOrder.details.prDetail.purchaseRequest.division',
        'purchaseOrder.details.prDetail.purchaseRequest.focal_person',
    ])->findOrFail($po_detail_id);

    $po = $poDetail->purchaseOrder;

    $correctDetail = $po->details->firstWhere('id', $inventoryItem->po_detail_id);
    if (!$correctDetail) {
        return redirect()->back()->with('error', 'No matching PO detail found for this inventory item.');
    }

    // Fetch all PPEs with their GLs
    $ppeOptions = PPESubMajorAccount::with('generalLedgerAccounts')->get();
    
    $props = [
        'purchaseOrder' => [
            'id' => $po->id,
            'po_number' => $po->po_number,
            'detail' => $correctDetail,
        ],
        'inventoryItem' => $inventoryItem,
        'user'          => Auth::user(),
        'ppeOptions'    => $ppeOptions,
    ];

    return Inertia::render('Supply/IssuancePage', $props);
}



public function store_ris(Request $request)
{
    $validated = $request->validate([
        'po_id'         => 'required|integer|exists:tbl_purchase_orders,id',
        'requested_by'  => 'required|integer|exists:users,id',
        'issued_by'     => 'required|integer|exists:users,id',
        'remarks'       => 'nullable|string|max:255',

        'items'                     => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.unit_cost'         => 'required|numeric|min:0.01',
        'items.*.total_cost'        => 'required|numeric|min:0.01',
        'items.*.quantity'          => 'required|numeric|min:0.01',
        'items.*.recipient'         => 'nullable|string|max:255', // ✅ per item
    ]);

    DB::beginTransaction();
    try {
        $po = PurchaseOrder::findOrFail($validated['po_id']);

        $ris = RIS::firstOrCreate(
            ['po_id' => $po->id],
            [
                'ris_number'   => $po->po_number,
                'requested_by' => $validated['requested_by'],
                'issued_by'    => $validated['issued_by'],
                'remarks'      => $validated['remarks'] ?? null,
            ]
        );

        foreach ($validated['items'] as $item) {
            $inventory = Inventory::findOrFail($item['inventory_item_id']);

            $remainingStock = $inventory->total_stock - $inventory->issued_qty;
            if ($remainingStock < $item['quantity']) {
                throw new \Exception("Not enough stock for {$inventory->item_desc}. Remaining: {$remainingStock}");
            }

            // ✅ Always create a new row per issuance
            $ris->items()->create([
                'inventory_item_id' => $item['inventory_item_id'],
                'quantity'          => $item['quantity'],
                'unit_cost'         => $item['unit_cost'],
                'total_cost'        => $item['quantity'] * $item['unit_cost'], // recalc
                'recipient'         => $item['recipient'] ?? null,
            ]);

            // Update stock
            $inventory->issued_qty += $item['quantity'];
            $inventory->status = ($inventory->issued_qty >= $inventory->total_stock) ? 'Issued' : 'Available';
            $inventory->save();
        }

        DB::commit();
        return redirect()->route('supply_officer.ris_issuance')
            ->with('success', "RIS {$ris->ris_number} successfully recorded.");
    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Failed to store RIS. ' . $e->getMessage()]);
    }
}



    public function ris_issuance(Request $request)
    {
        $search = $request->input('search');

        // Load POs with relationships
        $purchaseOrders = PurchaseOrder::with([
            'details.prDetail.product.category',
            'details.prDetail.product.unit',
            'details.prDetail.purchaseRequest.division',
            'details.prDetail.purchaseRequest.focal_person',
        ])->latest()->paginate(10);

        // Products involved in the POs
        $products = $purchaseOrders->flatMap(fn($po) => 
            $po->details->pluck('prDetail.product')
        )->filter();

        // Batch fetch inventory
        $inventoryItems = Inventory::whereIn('item_desc', $products->pluck('specs'))
            ->whereIn('unit_id', $products->pluck('unit_id'))
            ->get();

        // Load RIS headers with items + related data
        $ris = RIS::with([
            'requestedBy.division',
            'issuedBy.division',
            'po.details.prDetail.purchaseRequest.division',
            'items.inventoryItem.unit',
        ])->latest()->paginate(10);

        return Inertia::render('Supply/Ris', [
            'ris'            => $ris,
            'purchaseOrders' => $purchaseOrders,
            'inventoryItems' => $inventoryItems,
            'user'           => Auth::user(),
        ]);
    }
public function print_ris($id)
{
    $ris = RIS::with([
        'requestedBy.division',
        'issuedBy.division',
        'po.details.prDetail' => function ($query) {
            $query->select('id', 'pr_id', 'product_id', 'quantity');
        },
        'po.details.prDetail.purchaseRequest',
        'po.details.prDetail.purchaseRequest.division',
        'items.inventoryItem.unit',
        'items.inventoryItem.poDetail.prDetail.product',
    ])->findOrFail($id);


    $pdf = Pdf::loadView('pdf.print_ris', ['ris' => $ris])
        ->setPaper('A4', 'portrait'); 
    return $pdf->stream('RIS-'.$ris->ris_number.'.pdf');
}
public function printRisItem($risId, $itemId)
{
    $ris = RIS::with([
        'requestedBy.division',
        'issuedBy.division',
        'po.details.prDetail' => function ($query) {
            $query->select('id', 'pr_id', 'product_id', 'quantity');
        },
        'po.details.prDetail.purchaseRequest',
        'po.details.prDetail.purchaseRequest.division',
        'items.inventoryItem.unit',
        'items.inventoryItem.poDetail.prDetail.product',
    ])->findOrFail($risId);

    // Get the specific item
    $item = $ris->items()->where('id', $itemId)->firstOrFail();

    // Pass both the RIS and the single item to the view
    $pdf = Pdf::loadView('pdf.print_ris_item', [
        'ris' => $ris,
        'item' => $item
    ])->setPaper('A4', 'portrait');

    return $pdf->stream('RIS-'.$ris->ris_number.'-ITEM-'.$item->id.'.pdf');
}




public function store_ics(Request $request)
{
    $validated = $request->validate([
        'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
        'ics_number' => 'required|string|max:20',
        'requested_by' => 'required|integer|exists:users,id',
        'received_from' => 'required|integer|exists:users,id',
        'remarks' => 'nullable|string|max:255',

        'items' => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.inventory_item_number' => 'nullable|string|max:50',
        'items.*.ppe_sub_major_account' => 'nullable|string|max:100',
        'items.*.general_ledger_account' => 'nullable|string|max:100',
        'items.*.series_number' => 'nullable|string|max:100',
        'items.*.office' => 'nullable|string|max:100',
        'items.*.school' => 'nullable|string|max:100',

        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.unit_cost' => 'required|numeric|min:0.01',
        'items.*.total_cost' => 'required|numeric|min:0.01',
    ]);

    DB::beginTransaction();
    try {
        $po = PurchaseOrder::with(['details.prDetail.product'])->findOrFail($validated['po_id']);

        // 🔑 Always create new ICS
        $ics = ICS::firstOrcreate([
            'po_id' => $po->id,
            'ics_number' => $validated['ics_number'],
            'requested_by' => $validated['requested_by'],
            'received_from' => $validated['received_from'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $inventory = Inventory::findOrFail($item['inventory_item_id']);

            // Calculate remaining stock
            $remainingStock = $inventory->total_stock - $inventory->issued_qty;
            if ($remainingStock < $item['quantity']) {
                throw new \Exception("Not enough stock for {$inventory->item_desc}. Remaining: {$remainingStock}");
            }

            // Determine ICS item type
            $itemType = $item['unit_cost'] <= 5000 ? 'low' : 'high';

            // Save ICS item with extended fields
            $ics->items()->create([
                'inventory_item_id' => $inventory->id,
                'inventory_item_number' => $item['inventory_item_number'] ?? null,
                'ppe_sub_major_account' => $item['ppe_sub_major_account'] ?? null,
                'general_ledger_account' => $item['general_ledger_account'] ?? null,
                'series_number' => $item['series_number'] ?? null,
                'office' => $item['office'] ?? null,
                'school' => $item['school'] ?? null,
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'total_cost' => $item['total_cost'],
                'type' => $itemType,
            ]);

            // ✅ Increment issued_qty instead of subtracting from total_stock
            $inventory->issued_qty += $item['quantity'];
            $inventory->status = ($inventory->issued_qty >= $inventory->total_stock) ? 'Issued' : 'Available';
            $inventory->save();
        }

        DB::commit();

        // Redirect based on types included
        $hasLow = $ics->items()->where('type', 'low')->exists();
        $hasHigh = $ics->items()->where('type', 'high')->exists();

        if ($hasLow && $hasHigh) {
            return redirect()->route('supply_officer.ics_issuance_low')
                ->with('success', 'ICS recorded with both Low and High items.');
        } elseif ($hasLow) {
            return redirect()->route('supply_officer.ics_issuance_low')
                ->with('success', 'ICS recorded with Low items.');
        } elseif ($hasHigh) {
            return redirect()->route('supply_officer.ics_issuance_high')
                ->with('success', 'ICS recorded with High items.');
        }

        return redirect()->back()->with('success', 'ICS successfully recorded.');
    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Failed to store ICS. ' . $e->getMessage()]);
    }
}




public function print_ics($id, $types = null)
{
    $ics = ICS::with([
        'requestedBy.division',
        'receivedFrom.division',
        'po.details.prDetail' => function ($query) {
            $query->select('id', 'pr_id', 'product_id', 'quantity');
        },
        'po.details.prDetail.purchaseRequest',
        'po.details.prDetail.purchaseRequest.division',
        'items.inventoryItem.unit',
        'items.inventoryItem.poDetail.prDetail.product',
    ])->findOrFail($id);

    // Filter items if types are provided
    if ($types) {
        $ics->items = $ics->items->whereIn('type', (array) $types)->values();
    }

    $pdf = Pdf::loadView('pdf.print_ics', ['ics' => $ics])
        ->setPaper('A4', 'portrait');

    $typeSuffix = $types ? '-'.implode('-', (array)$types) : '';
    return $pdf->stream('ICS-'.$ics->ics_number.$typeSuffix.'.pdf');
}

public function print_ics_all($id)
{
    $ics = ICS::with([
        'requestedBy.division',
        'receivedFrom.division',
        'po.details.prDetail' => fn($q) => $q->select('id','pr_id','product_id','quantity'),
        'po.details.prDetail.purchaseRequest',
        'po.details.prDetail.purchaseRequest.division',
        'items.inventoryItem.unit',
        'items.inventoryItem.poDetail.prDetail.product',
    ])->findOrFail($id);

    // Include all items regardless of type
    // Optional: you could still sort by type if needed
    $ics->items = $ics->items->sortBy('type')->values();

    $pdf = Pdf::loadView('pdf.print_ics', ['ics' => $ics])
        ->setPaper('A4', 'portrait');

    return $pdf->stream('ICS-'.$ics->ics_number.'-all.pdf');
}

    public function ics_issuance_low(Request $request)
        {
            $search = $request->input('search');

            // Get ALL POs with nested relationships
            $purchaseOrders = PurchaseOrder::with([
                'details.prDetail.product.category', 
                'details.prDetail.product.unit',
                'details.prDetail.purchaseRequest.division',
                'details.prDetail.purchaseRequest.focal_person'
            ])->paginate(10);
            $ics = ICS::whereHas('items', function ($q) {
                    $q->where('type', 'low');
                })
                ->with([
                    'requestedBy',
                    'items.inventoryItem.unit',
                    'po.rfq.purchaseRequest.division',
                    'po.rfq.purchaseRequest.focal_person',
                ])
                ->latest()
                ->paginate(10);

            foreach ($purchaseOrders as $po) {
                foreach ($po->details as $detail) {
                    $product = $detail->prDetail->product ?? null;

                    if ($product) {
                        $inventory = Inventory::where('item_desc', $product->specs)
                            ->where('unit_id', $product->unit_id)
                            ->first();

                        $inventoryItems[] = [
                            'po_id' => $po->id,
                            'item_desc' => $product->specs,
                            'inventory' => $inventory,
                        ];
                    }
                }
            }
            return Inertia::render('Supply/Ics', [
                'purchaseOrders' => $purchaseOrders,
                'inventoryItems' => $inventoryItems,
                'ics' => $ics,
                'user' => Auth::user(), 
            ]);
    }

    public function ics_issuance_high(Request $request)
    {
        $search = $request->input('search');

        // Get ALL POs with nested relationships (like ICS Low)
        $purchaseOrders = PurchaseOrder::with([
            'details.prDetail.product.category', 
            'details.prDetail.product.unit',
            'details.prDetail.purchaseRequest.division',
            'details.prDetail.purchaseRequest.focal_person'
        ])->paginate(10);

        $ics = ICS::whereHas('items', function ($q) {
                $q->where('type', 'high');
            })
            ->with([
                'requestedBy',
                'items.inventoryItem.unit',
                'po.rfq.purchaseRequest.division',
                'po.rfq.purchaseRequest.focal_person',
            ])
            ->latest()
            ->paginate(10);

        // Map all related inventory items (optional)
        $inventoryItems = [];
        foreach ($purchaseOrders as $po) {
            foreach ($po->details as $detail) {
                $product = $detail->prDetail->product ?? null;

                if ($product) {
                    $inventory = Inventory::where('item_desc', $product->specs)
                        ->where('unit_id', $product->unit_id)
                        ->first();

                    $inventoryItems[] = [
                        'po_id' => $po->id,
                        'item_desc' => $product->specs,
                        'inventory' => $inventory,
                    ];
                }
            }
        }

        return Inertia::render('Supply/IcsHigh', [
            'purchaseOrders' => $purchaseOrders,
            'inventoryItems' => $inventoryItems,
            'ics' => $ics,
            'user' => Auth::user(),
        ]);
    }

public function store_par(Request $request)
{
    $validated = $request->validate([
        'po_id'   => 'required|integer|exists:tbl_purchase_orders,id',
        'par_number' => 'required|string|max:20',
        'requested_by' => 'required|integer|exists:users,id',
        'issued_by'   => 'required|integer|exists:users,id',
        'date_acquired' => 'nullable|date',
        'remarks'    => 'nullable|string|max:255',

        'items'      => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.inventory_item_number' => 'nullable|string|max:50',
        'items.*.ppe_sub_major_account' => 'nullable|string|max:100',
        'items.*.general_ledger_account' => 'nullable|string|max:100',
        'items.*.series_number' => 'nullable|string|max:100',
        'items.*.office' => 'nullable|string|max:100',
        'items.*.school' => 'nullable|string|max:100',

        'items.*.quantity'          => 'required|numeric|min:0.01',
        'items.*.unit_cost'         => 'required|numeric|min:0.01',
        'items.*.total_cost'        => 'required|numeric|min:0.01',
        'items.*.property_no'       => 'nullable|string|max:50',
    ]);

    DB::beginTransaction();

    try {
        // 1️⃣ Create or get existing PAR
        $par = PAR::firstOrCreate(
            ['par_number' => $validated['par_number']],
            [
                'po_id' => $validated['po_id'],
                'requested_by' => $validated['requested_by'],
                'issued_by' => $validated['issued_by'],
                'remarks' => $validated['remarks'] ?? null,
                'date_acquired' => $validated['date_acquired'] ?? null,
            ]
        );

        foreach ($validated['items'] as $item) {
            $inventory = Inventory::findOrFail($item['inventory_item_id']);

            // Check stock availability
            if ($inventory->total_stock < $item['quantity']) {
                throw new \Exception("Not enough stock for {$inventory->item_desc}. Remaining: {$inventory->total_stock}");
            }

            // Create or update PAR item
            $parItem = $par->items()->updateOrCreate(
                ['inventory_item_id' => $inventory->id],
                [
                    'inventory_item_number' => $item['inventory_item_number'] ?? null,
                    'ppe_sub_major_account' => $item['ppe_sub_major_account'] ?? null,
                    'general_ledger_account' => $item['general_ledger_account'] ?? null,
                    'series_number' => $item['series_number'] ?? null,
                    'office' => $item['office'] ?? null,
                    'school' => $item['school'] ?? null,
                    'quantity' => 0,
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => 0,
                    'property_no' => $item['property_no'] ?? null,
                ]
            );

            // Increment quantities & totals
            $parItem->quantity += $item['quantity'];
            $parItem->total_cost += $item['total_cost'];
            $parItem->save();

            // Deduct from inventory stock
            $inventory->total_stock -= $item['quantity'];
            $inventory->status = $inventory->total_stock > 0 ? 'Available' : 'Issued';
            $inventory->save();
        }

        DB::commit();

        return redirect()->route('supply_officer.par_issuance')
            ->with('success', 'PAR successfully recorded or updated with new items.');
    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Failed to store PAR. ' . $e->getMessage()]);
    }
}

    public function print_par($id)
    {
        $par = PAR::with([
            'requestedBy.division',
            'issuedBy.division',
            'po.details.prDetail' => function ($query) {
                $query->select('id', 'pr_id', 'product_id', 'quantity');
            },
            'po.details.prDetail.purchaseRequest',
            'po.details.prDetail.purchaseRequest.division',
            'items.inventoryItem.unit',
            'items.inventoryItem.poDetail.prDetail.product',
        ])->findOrFail($id);


        $pdf = Pdf::loadView('pdf.print_par', ['par' => $par])
            ->setPaper('A4', 'portrait'); 
        return $pdf->stream('PAR-'.$par->par_number.'.pdf');
    }

public function par_issuance(Request $request)
{
    $search = $request->input('search');

    // Load POs with relationships
    $purchaseOrders = PurchaseOrder::with([
        'details.prDetail.product.unit',
        'details.prDetail.purchaseRequest.division',
        'details.prDetail.purchaseRequest.focal_person'
    ])->latest()->paginate(10);

    // Load PAR headers with nested items and related data
    $parQuery = PAR::with([
        'po.rfq.purchaseRequest.division',
        'po.rfq.purchaseRequest.focal_person',
        'items.inventoryItem.unit', // ensures items are nested
        'requestedBy',
    ]);

    // Apply search to PAR number or item description
    if ($search) {
        $parQuery->where('par_number', 'like', "%{$search}%")
                 ->orWhereHas('items.inventoryItem', function ($q) use ($search) {
                     $q->where('item_desc', 'like', "%{$search}%");
                 });
    }

    $par = $parQuery->latest()->paginate(10)->withQueryString();

    // Optional: map inventory items for easier front-end reference
    $inventoryItems = [];
    foreach ($purchaseOrders as $po) {
        foreach ($po->details as $detail) {
            $product = $detail->prDetail->product ?? null;
            if ($product) {
                $inventory = Inventory::where('item_desc', $product->specs)
                    ->where('unit_id', $product->unit_id)
                    ->first();
                $inventoryItems[] = [
                    'po_id' => $po->id,
                    'item_desc' => $product->specs,
                    'inventory' => $inventory,
                ];
            }
        }
    }

    return Inertia::render('Supply/Par', [
        'purchaseOrders' => $purchaseOrders,
        'inventoryItems' => $inventoryItems,
        'par' => $par,
        'user' => Auth::user(),
    ]);
}




}
