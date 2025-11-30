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
private function generateRISNumber()
{
    $year = now()->format('y');
    $month = now()->format('m');

    // Get the last RIS created this year
    $lastRIS = RIS::whereYear('created_at', now()->year)
        ->latest('id')
        ->first();

    if ($lastRIS && preg_match('/\d{2}-\d{2}-(\d{3})$/', $lastRIS->ris_number, $matches)) {
        $lastSeries = (int) $matches[1];
        $nextSeries = $lastSeries + 1;
    } else {
        $nextSeries = 1;
    }

    $series = str_pad($nextSeries, 3, '0', STR_PAD_LEFT);
    return "{$year}-{$month}-{$series}";
}

private function generateICSNumber($type = 'low')
{
    $year = now()->format('y');
    $month = now()->format('m');
    $prefix = $type === 'high' ? 'H' : 'L';

    // Find last ICS created this year for the specific type
    $lastICS = ICS::whereYear('created_at', now()->year)
        ->whereHas('items', function ($query) use ($type) {
            $query->where('type', $type);
        })
        ->latest('id')
        ->first();

    if ($lastICS && preg_match('/[LH]-\d{2}-\d{2}-(\d{3})$/', $lastICS->ics_number, $matches)) {
        $lastSeries = (int) $matches[1];
        $nextSeries = $lastSeries + 1;
    } else {
        $nextSeries = 1;
    }

    $series = str_pad($nextSeries, 3, '0', STR_PAD_LEFT);
    return "{$prefix}-{$year}-{$month}-{$series}";
}

private function generatePARNumber()
{
    $year = now()->format('y');
    $month = now()->format('m');

    $lastPAR = PAR::whereYear('created_at', now()->year)
        ->latest('id')
        ->first();

    if ($lastPAR && preg_match('/\d{2}-\d{2}-(\d{3})$/', $lastPAR->par_number, $matches)) {
        $lastSeries = (int) $matches[1];
        $nextSeries = $lastSeries + 1;
    } else {
        $nextSeries = 1;
    }

    $series = str_pad($nextSeries, 3, '0', STR_PAD_LEFT);
    return "{$year}-{$month}-{$series}";
}


public function issuance(Request $request, $inventory_id = null)
{
    $selectedItems = $request->items ?? null;

    // -------- MULTI-ITEM ISSUANCE --------
    if ($selectedItems && is_array($selectedItems)) {
        $inventoryItems = Inventory::with([
    'unit',
    'product',
    'poDetail' => function ($q) {
        $q->with([
            'purchaseOrder' => fn($q2) => $q2->with('supplier'),
            'prDetail.purchaseRequest.focal_person',
            'prDetail.purchaseRequest.division',
            'prDetail.product.unit',
        ]);
    },
])->whereIn('id', $selectedItems)->get();


        if ($inventoryItems->isEmpty()) {
            return back()->with('error', 'No valid inventory items selected.');
        }

        // Determine type based on highest unit cost
        $unitCosts = $inventoryItems->pluck('unit_cost')->filter();
        $type = $unitCosts->max() >= 5000 ? 'high' : 'low';

        $ppeOptions = PPESubMajorAccount::with('generalLedgerAccounts')->get();

        // Get PO if all items belong to the same PO
        $poIds = $inventoryItems->pluck('poDetail.purchaseOrder.id')->filter()->unique();

$purchaseOrder = null;
if ($poIds->count() === 1) {
    $poDetail = $inventoryItems->first()->poDetail;
    if ($poDetail && $poDetail->purchaseOrder) {
        $po = $poDetail->purchaseOrder;
        $purchaseOrder = [
            'id' => $po->id,
            'po_number' => $po->po_number,
            'detail' => $poDetail,
            'supplier' => $po->supplier,
        ];
    }
}

        // Default recipient/division
        $inventoryItems->transform(function ($item) {
            $pr = $item->poDetail?->prDetail?->purchaseRequest;
            $item->default_recipient = $pr?->focal_person?->id ?? null;
            $item->default_division = $pr?->division?->division ?? null;
            return $item;
        });

        return Inertia::render('Supply/IssuancePage', [
            'isMulti' => true,
            'inventoryItems' => $inventoryItems,
            'user' => Auth::user(),
            'ppeOptions' => $ppeOptions,
            'risNumber' => $this->generateRISNumber(),
            'icsNumber' => $this->generateICSNumber($type),
            'parNumber' => $this->generatePARNumber(),
            'type' => $type,
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    // -------- SINGLE ITEM ISSUANCE --------
    if (!$inventory_id) {
        return back()->with('error', 'No inventory selected.');
    }

    $inventoryItem = Inventory::with([
        'unit',
        'product',
        'poDetail.purchaseOrder.supplier',
        'poDetail.prDetail.purchaseRequest.focal_person',
        'poDetail.prDetail.purchaseRequest.division',
        'poDetail.prDetail.product.unit',
    ])->findOrFail($inventory_id);

    $unitCost = $inventoryItem->unit_cost ?? 0;
    $type = $unitCost >= 5000 ? 'high' : 'low';

    $ppeOptions = PPESubMajorAccount::with('generalLedgerAccounts')->get();

    $purchaseOrder = null;
    $poDetail = $inventoryItem->poDetail;
    if ($poDetail && $poDetail->purchaseOrder) {
        $po = $poDetail->purchaseOrder;
        $purchaseOrder = [
            'id' => $po->id,
            'po_number' => $po->po_number,
            'detail' => $poDetail,
            'supplier' => $po->supplier,
        ];
    }

    $pr = $poDetail?->prDetail?->purchaseRequest;
    $inventoryItem->default_recipient = $pr?->focal_person?->id ?? null;
    $inventoryItem->default_division = $pr?->division?->division ?? null;

    return Inertia::render('Supply/IssuancePage', [
        'inventoryItem' => $inventoryItem,
        'user' => Auth::user(),
        'ppeOptions' => $ppeOptions,
        'risNumber' => $this->generateRISNumber(),
        'icsNumber' => $this->generateICSNumber($type),
        'parNumber' => $this->generatePARNumber(),
        'type' => $type,
        'purchaseOrder' => $purchaseOrder,
        'isMulti' => false,
    ]);
}


public function store_ris(Request $request)
{
    $validated = $request->validate([
        'ris_number' => 'required|string',
        'po_id' => 'nullable|integer|exists:tbl_purchase_orders,id',
        'requested_by' => 'nullable|integer|exists:users,id',
        'issued_by' => 'required|integer|exists:users,id',
        'remarks' => 'nullable|string',
        'items' => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.recipient' => 'nullable|string',
        'items.*.recipient_division' => 'nullable|string',
        'items.*.quantity' => 'required|numeric|min:1',
        'items.*.unit_cost' => 'required|numeric|min:0',
        'items.*.total_cost' => 'required|numeric|min:0',
    ]);

    // 🔍 Check if RIS already exists
    $ris = RIS::where('ris_number', $validated['ris_number'])->first();

    // Determine PO ID from items if not explicitly provided
    if (!$validated['po_id'] && count($validated['items']) > 0) {
        $poIds = Inventory::whereIn('id', collect($validated['items'])->pluck('inventory_item_id'))
            ->with('poDetail.purchaseOrder')
            ->get()
            ->pluck('poDetail.purchaseOrder.id')
            ->filter()
            ->unique();

        $validated['po_id'] = $poIds->count() === 1 ? $poIds->first() : null;
    }

    if (!$ris) {
        // 🆕 Create a new RIS if not found
        $ris = RIS::create([
            'po_id' => $validated['po_id'] ?? null,
            'ris_number' => $validated['ris_number'],
            'requested_by' => $validated['requested_by'] ?? null,
            'issued_by' => $validated['issued_by'],
            'remarks' => $validated['remarks'] ?? null,
        ]);
    }

    // 🧾 Attach the item(s) to the RIS
    foreach ($validated['items'] as $item) {
        $ris->items()->create([
            'inventory_item_id' => $item['inventory_item_id'],
            'recipient' => $item['recipient'] ?? null,
            'recipient_division' => $item['recipient_division'] ?? null,
            'quantity' => $item['quantity'],
            'unit_cost' => $item['unit_cost'],
            'total_cost' => $item['total_cost'],
        ]);

        // 📦 Update inventory counts
        $inventory = Inventory::find($item['inventory_item_id']);
        if ($inventory) {
            $inventory->total_stock -= $item['quantity'];
            $inventory->save();
        }
    }

    return redirect()
        ->route('supply_officer.ris_issuance')
        ->with('success', 'Item(s) successfully added to RIS.');
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
        ])
        ->with(['items' => function ($query) {
            $query->withSum('reissuedItem as total_reissued_quantity', 'quantity')
                ->withSum('disposedItem as total_disposed_quantity', 'quantity')
                ->with(['reissuedItem', 'disposedItem']);
        }])
        ->latest()
        ->paginate(10);


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
        'po_id' => 'nullable|integer|exists:tbl_purchase_orders,id',
        'ics_number' => 'required|string|max:20',
        'requested_by' => 'nullable|integer|exists:users,id',
        'received_from' => 'required|integer|exists:users,id',
        'remarks' => 'nullable|string|max:255',

        'items' => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.recipient' => 'nullable|string',
        'items.*.recipient_division' => 'nullable|string',
        'items.*.estimated_useful_life' => 'nullable|numeric|min:0.01',
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

    // Determine PO ID if not explicitly provided
    if (!$validated['po_id'] && count($validated['items']) > 0) {
        $poIds = Inventory::whereIn('id', collect($validated['items'])->pluck('inventory_item_id'))
            ->with('poDetail.purchaseOrder')
            ->get()
            ->pluck('poDetail.purchaseOrder.id')
            ->filter()
            ->unique();

        $validated['po_id'] = $poIds->count() === 1 ? $poIds->first() : null;
    }

    // Check if ICS already exists
    $ics = ICS::where('ics_number', $validated['ics_number'])->first();
    if (!$ics) {
        $ics = ICS::create([
            'po_id' => $validated['po_id'] ?? null,
            'ics_number' => $validated['ics_number'],
            'requested_by' => $validated['requested_by'] ?? null,
            'received_from' => $validated['received_from'],
            'remarks' => $validated['remarks'] ?? null,
        ]);
    }

    // Attach all items
    foreach ($validated['items'] as $item) {
        $inventory = Inventory::find($item['inventory_item_id']);
        if (!$inventory) continue;

        $itemType = $item['unit_cost'] <= 5000 ? 'low' : 'high';

        $ics->items()->create([
            'inventory_item_id' => $inventory->id,
            'recipient' => $item['recipient'] ?? null,
            'recipient_division' => $item['recipient_division'] ?? null,
            'estimated_useful_life' => $item['estimated_useful_life'] ?? null,
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

        // Update inventory stock
        $inventory->total_stock -= $item['quantity'];
        $inventory->save();
    }

    return redirect()
        ->route('supply_officer.ics_issuance_low')
        ->with('success', 'Item(s) successfully added to ICS.');
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
                ->with(['items' => function ($query) {
                    $query->withSum('reissuedItem as total_reissued_quantity', 'quantity')
                        ->withSum('disposedItem as total_disposed_quantity', 'quantity')
                        ->with(['reissuedItem', 'disposedItem']);
                }])
                ->latest()
                ->paginate(10);
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
                'requestedBy.division',
                'items.inventoryItem.unit',
                'po.rfq.purchaseRequest.division',
                'po.rfq.purchaseRequest.focal_person',
                ])
        ->with(['items' => function ($query) {
            $query->withSum('reissuedItem as total_reissued_quantity', 'quantity')
                ->withSum('disposedItem as total_disposed_quantity', 'quantity')
                ->with(['reissuedItem', 'disposedItem']);
        }])
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
        'po_id'   => 'nullable|integer|exists:tbl_purchase_orders,id',
        'par_number' => 'required|string|max:20',
        'requested_by' => 'nullable|integer|exists:users,id',
        'issued_by'   => 'required|integer|exists:users,id',
        'date_acquired' => 'nullable|date',
        'remarks'    => 'nullable|string|max:255',

        'items'      => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.recipient' => 'nullable|string',
        'items.*.recipient_division' => 'nullable|string',
        'items.*.estimated_useful_life' => 'numeric|min:0.01',
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

    $par = PAR::where('par_number', $validated['par_number'])->first();
    if (!$par) {
        // 🆕 Create a new RIS if not found
        $par = PAR::create([
            'po_id' => $validated['po_id'] ?? null,
            'par_number' => $validated['par_number'],
            'requested_by' => $validated['requested_by'] ?? null,
            'issued_by' => $validated['issued_by'],
            'remarks' => $validated['remarks'] ?? null,
        ]);
    }

    // 🧾 Attach the item(s)
    foreach ($validated['items'] as $item) {
        $inventory = Inventory::find($item['inventory_item_id']);
        $par->items()->create([
            'inventory_item_id' => $inventory->id,
            'recipient' => $item['recipient'],
            'recipient_division' => $item['recipient_division'],
            'estimated_useful_life' => $item['estimated_useful_life'] ?? null,
            'inventory_item_number' => $item['inventory_item_number'] ?? null,
            'ppe_sub_major_account' => $item['ppe_sub_major_account'] ?? null,
            'general_ledger_account' => $item['general_ledger_account'] ?? null,
            'series_number' => $item['series_number'] ?? null,
            'office' => $item['office'] ?? null,
            'school' => $item['school'] ?? null,
            'quantity' => $item['quantity'],
            'unit_cost' => $item['unit_cost'],
            'total_cost' => $item['total_cost'],
        ]);
        $inventory->total_stock -= $item['quantity'];
        $inventory->save();
    }
    return redirect()->route('supply_officer.par_issuance')->with('success', 'Item successfully added to PAR.');
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
    'items.inventoryItem.unit',
    'requestedBy',
    ])
    ->with(['items' => function ($query) {
        // use plural relation names if relation is hasMany
        $query->withSum('reissuedItem as total_reissued_quantity', 'quantity')
            ->withSum('disposedItem as total_disposed_quantity', 'quantity')
            ->with(['reissuedItem', 'disposedItem']);
    }]);


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
