<?php

namespace App\Http\Controllers\Supply;

use App\Exports\RISExport;
use App\Exports\RISExportMonthly;
use App\Http\Controllers\Controller;
use App\Models\ICS;
use App\Models\Inventory;
use App\Models\PAR;
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

        // Find PO Detail and load its Purchase Order
        $poDetail = PurchaseOrderDetail::with([
            'purchaseOrder.supplier',
            'purchaseOrder.details.prDetail.product.category',
            'purchaseOrder.details.prDetail.product.unit',
            'purchaseOrder.details.prDetail.purchaseRequest.division',
            'purchaseOrder.details.prDetail.purchaseRequest.focal_person',
        ])->findOrFail($po_detail_id);

        $po = $poDetail->purchaseOrder; // ✅ now you have the PO

        // Ensure the PO detail matches the inventory item
        $correctDetail = $po->details->firstWhere('id', $inventoryItem->po_detail_id);

        if (!$correctDetail) {
            return redirect()->back()->with('error', 'No matching PO detail found for this inventory item.');
        }

        $product = $correctDetail->prDetail->product;
        $categoryName = strtolower($product->category->name ?? '');
        $totalPricePO = $correctDetail->total_price;

        $props = [
            'purchaseOrder' => [
                'id' => $po->id,
                'po_number' => $po->po_number,
                'detail' => $correctDetail,
            ],
            'inventoryItem' => $inventoryItem,
            'user' => Auth::user(),
        ];

        if ($categoryName === 'consumable') {
            return Inertia::render('Supply/RisForm', $props);
        }

        if ($categoryName === 'semi-expendable' && $totalPricePO < 50000) {
            return Inertia::render('Supply/IcsForm', $props);
        }

        if ($categoryName === 'non-expendable' && $totalPricePO >= 50000) {
            return Inertia::render('Supply/ParForm', $props);
        }

        return redirect()->back()->with('error', "No appropriate issuance form found for this item's category ({$categoryName}) and price (₱{$totalPricePO}).");
    }

    public function store_ris(Request $request)
    {
        $validated = $request->validate([
            'po_id'       => 'required|integer|exists:tbl_purchase_orders,id',
            'issued_to'   => 'required|integer|exists:users,id',
            'issued_by'   => 'required|integer|exists:users,id',
            'remarks'     => 'nullable|string|max:255',

            'items'                     => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
            'items.*.unit_cost'         => 'required|numeric|min:0.01',
            'items.*.total_cost'        => 'required|numeric|min:0.01',
            'items.*.quantity'          => 'required|numeric|min:0.01',
        ]);

        DB::beginTransaction();
        try {
            $po = PurchaseOrder::findOrFail($validated['po_id']);

            // ✅ Get or create RIS for this PO
            $ris = RIS::firstOrCreate(
                ['po_id' => $po->id], // unique per PO
                [
                    'ris_number' => $po->po_number,
                    'issued_to'  => $validated['issued_to'],
                    'issued_by'  => $validated['issued_by'],
                    'remarks'    => $validated['remarks'] ?? null,
                ]
            );

            // Group duplicate items by inventory_item_id
            $groupedItems = collect($validated['items'])->groupBy('inventory_item_id');

            foreach ($groupedItems as $inventoryId => $items) {
                $quantity = $items->sum('quantity');
                $unitCost = $items->first()['unit_cost']; // ✅ take from user input
                $totalCost = $unitCost * $quantity;       // ✅ always recalc backend

                $inventory = Inventory::findOrFail($inventoryId);

                if ($inventory->total_stock < $quantity) {
                    throw new \Exception("Not enough stock for {$inventory->item_desc}");
                }

                // Update existing RIS item or create new
                $risItem = $ris->items()->where('inventory_item_id', $inventoryId)->first();
                if ($risItem) {
                    $risItem->quantity   += $quantity;
                    $risItem->total_cost += $totalCost;
                    $risItem->unit_cost   = $unitCost; // ✅ update to last input
                    $risItem->save();
                } else {
                    $ris->items()->create([
                        'inventory_item_id' => $inventoryId,
                        'quantity'          => $quantity,
                        'unit_cost'         => $unitCost,
                        'total_cost'        => $totalCost,
                    ]);
                }

                // Deduct stock
                $inventory->total_stock -= $quantity;
                $inventory->status = $inventory->total_stock > 0 ? 'Available' : 'Issued';
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
            'issuedTo.division',
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
        'issuedTo.division',
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



    public function store_ics(Request $request)
    {
        $validated = $request->validate([
            'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
            'ics_number' => 'required|string|max:20',
            'received_by' => 'required|integer|exists:users,id',
            'received_from' => 'required|integer|exists:users,id',
            'remarks' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0.01',
            'items.*.total_cost' => 'required|numeric|min:0.01',
        ]);

        DB::beginTransaction();
        try {
            $po = PurchaseOrder::with([
                'details.prDetail.product.category',
            ])->findOrFail($validated['po_id']);

            // Determine ICS type based on first item's category
            $firstPoDetail = $po->details->first();
            $firstCategory = optional($firstPoDetail?->prDetail?->product?->category)->name;
            $icsType = null;
            if ($firstCategory === 'Semi-Expendable') { // Title Case match
                $unitCost = $validated['items'][0]['unit_cost'];
                $icsType = $unitCost < 5000 ? 'low' : 'high';
            }

            // Get or create ICS for this PO
            $ics = ICS::firstOrCreate(
                ['po_id' => $po->id], // unique per PO
                [
                    'ics_number' => $validated['ics_number'],
                    'received_by' => $validated['received_by'],
                    'received_from' => $validated['received_from'],
                    'remarks' => $validated['remarks'] ?? null,
                    'type' => $icsType, // store type in ICS header
                ]
            );

            // Group duplicate items by inventory_item_id
            $groupedItems = collect($validated['items'])->groupBy('inventory_item_id');

            foreach ($groupedItems as $inventoryId => $items) {
                $quantity = $items->sum('quantity');
                $unitCost = $items->first()['unit_cost'];
                $totalCost = $items->sum('total_cost');

                $inventory = Inventory::findOrFail($inventoryId);

                if ($inventory->total_stock < $quantity) {
                    throw new \Exception("Not enough stock for {$inventory->item_desc}");
                }

                // Create ICS item
                $icsItem = $ics->items()->firstOrCreate(
                    ['inventory_item_id' => $inventoryId],
                    [
                        'quantity' => 0,
                        'unit_cost' => $unitCost,
                        'total_cost' => 0,
                    ]
                );

                $icsItem->quantity += $quantity;
                $icsItem->unit_cost = $unitCost;
                $icsItem->total_cost += $totalCost;
                $icsItem->save();

                // Deduct stock
                $inventory->total_stock -= $quantity;
                $inventory->status = $inventory->total_stock > 0 ? 'Available' : 'Issued';
                $inventory->save();
            }

            DB::commit();

            // Redirect based on ICS type
            if ($icsType === 'low') {
                return redirect()->route('supply_officer.ics_issuance_low')
                    ->with('success', 'ICS (Low) successfully recorded.');
            } elseif ($icsType === 'high') {
                return redirect()->route('supply_officer.ics_issuance_high')
                    ->with('success', 'ICS (High) successfully recorded.');
            }

            return redirect()->route('supply_officer.ics_issuance_low')
                ->with('success', 'ICS successfully recorded.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to store ICS. ' . $e->getMessage()]);
        }
    }
    public function print_ics($id)
    {
        $ics = ICS::with([
            'receivedBy.division',
            'receivedFrom.division',
            'po.details.prDetail' => function ($query) {
                $query->select('id', 'pr_id', 'product_id', 'quantity');
            },
            'po.details.prDetail.purchaseRequest',
            'po.details.prDetail.purchaseRequest.division',
            'items.inventoryItem.unit',
            'items.inventoryItem.poDetail.prDetail.product',
        ])->findOrFail($id);


        $pdf = Pdf::loadView('pdf.print_ics', ['ics' => $ics])
            ->setPaper('A4', 'portrait'); 
        return $pdf->stream('ICS-'.$ics->ics_number.'.pdf');
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
        $ics = ICS::where('type', 'low')->with(['receivedBy','items.inventoryItem.unit','po.rfq.purchaseRequest.division',
            'po.rfq.purchaseRequest.focal_person',])->latest()->paginate(10);
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

        $ics = ICS::where('type', 'high')->with([
            'receivedBy',
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

        return Inertia::render('Supply/Ics', [
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
        'received_by' => 'required|integer|exists:users,id',
        'issued_by'   => 'required|integer|exists:users,id',
        'date_acquired' => 'nullable|date',
        'remarks'    => 'nullable|string|max:255',
        'items'      => 'required|array|min:1',
        'items.*.inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'items.*.quantity'          => 'required|numeric|min:0.01',
        'items.*.unit_cost'         => 'required|numeric|min:0.01',
        'items.*.total_cost'        => 'required|numeric|min:0.01',
        'items.*.property_no'       => 'nullable|string|max:50',
    ]);

    DB::beginTransaction();

    try {
        // 1️⃣ Get existing PAR or create new
        $par = PAR::firstOrCreate(
            ['par_number' => $validated['par_number']],
            [
                'po_id' => $validated['po_id'],
                'received_by' => $validated['received_by'],
                'issued_by' => $validated['issued_by'],
                'remarks' => $validated['remarks'] ?? null,
                'date_acquired' => $validated['date_acquired'] ?? null,
            ]
        );

        // 2️⃣ Group items by inventory_item_id
        $groupedItems = collect($validated['items'])->groupBy('inventory_item_id');

        foreach ($groupedItems as $inventoryId => $items) {
            $quantity = $items->sum('quantity');
            $unitCost = $items->first()['unit_cost'];
            $totalCost = $items->sum('total_cost');
            $propertyNo = $items->first()['property_no'] ?? null;

            $inventory = Inventory::findOrFail($inventoryId);

            if ($inventory->total_stock < $quantity) {
                throw new \Exception("Not enough stock for {$inventory->item_desc}");
            }

            // 3️⃣ Append or update PAR items
            $parItem = $par->items()->firstOrCreate(
                ['inventory_item_id' => $inventoryId],
                [
                    'quantity' => 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => 0,
                    'property_no' => $propertyNo,
                ]
            );

            $parItem->quantity += $quantity;
            $parItem->unit_cost = $unitCost;
            $parItem->total_cost += $totalCost;
            $parItem->property_no = $propertyNo; // overwrite if provided
            $parItem->save();

            // 4️⃣ Deduct stock
            $inventory->total_stock -= $quantity;
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
            'receivedBy.division',
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
        'receivedBy',
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



    public function export_excel(Request $request)
    {
        $month = $request->input('month');
        $year  = $request->input('year');

        // Default filename (with date if provided)
        $fileName = 'RIS_Report';
        if ($month && $year) {
            $fileName .= '_' . date("F", mktime(0, 0, 0, $month, 10)) . '_' . $year;
        } elseif ($year) {
            $fileName .= '_' . $year;
        }

        return Excel::download(
            new RISExport($month, $year),
            $fileName . '.xlsx'
        );
    }

    public function export_excel_monthly(Request $request)
    {
        $month = $request->input('month'); // Example: 3 (March)
        $year  = $request->input('year');  // Example: 2025

        if (!$month || !$year) {
            return back()->with('error', 'Please select both month and year.');
        }

        // File name example: RIS_Report_March_2025.xlsx
        $fileName = 'RIS_Report_' . date("F", mktime(0, 0, 0, $month, 10)) . '_' . $year . '.xlsx';

        return Excel::download(
            new RISExportMonthly($month, $year),
            $fileName
        );
    }


}
