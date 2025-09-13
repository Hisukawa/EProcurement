<?php

namespace App\Http\Controllers\Supply;

use App\Exports\RISExport;
use App\Exports\RISExportMonthly;
use App\Http\Controllers\Controller;
use App\Models\AuditLogs;
use App\Models\Division;
use App\Models\IAR;
use App\Models\ICS;
use App\Models\InspectionCommittee;
use App\Models\InspectionCommitteeMember;
use App\Models\Inventory;
use App\Models\PAR;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use App\Models\PurchaseRequest;
use App\Models\RFQ;
use App\Models\RIS;
use App\Models\Supplier;
use App\Models\SupplyCategory;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class SupplyController extends Controller
{
    public function dashboard() {
    $totalStock = Inventory::sum('total_stock');
    $pendingDeliveries = PurchaseOrder::where("status", "Not yet Delivered")->count();
    $totalIcs = ICS::count();
    $totalRis = RIS::count();
    $totalIcsHigh = ICS::where('type', 'high')->count();
    $totalIcsLow = ICS::where('type', 'low')->count();
    $totalPar = PAR::count();

    $totalIssued = $totalIcs + $totalRis + $totalPar;
    $totalPo = PurchaseOrder::count();
    $categories = SupplyCategory::all();

    $user = Auth::user();

    $risActivity = RIS::with(['issuedTo', 'issuedBy', 'inventoryItem'])
        ->latest('created_at')
        ->take(5)
        ->get()
        ->map(fn($r) => [
            'id' => $r->ris_number,
            'action' => "Issued {$r->quantity} {$r->inventoryItem->item_desc}",
            'status' => 'Processed',
            'date' => $r->created_at->format('M d, Y'),
        ]);

    $icsActivity = ICS::with('inventoryItem')
        ->latest('created_at')
        ->take(5)
        ->get()
        ->map(fn($i) => [
            'id' => $i->ics_number,
            'action' => "Received {$i->quantity} {$i->inventoryItem->item_desc}",
            'status' => 'Processed',
            'date' => $i->created_at->format('M d, Y'),
        ]);
    $parActivity = PAR::with('inventoryItem')
        ->latest('created_at')
        ->take(5)
        ->get()
        ->map(fn($p) => [
            'id' => $p->par_number,
            'action' => "Issued {$p->quantity} {$p->inventoryItem->item_desc}",
            'status' => 'Processed',
            'date' => $p->created_at->format('M d, Y'),
        ]);

    $recentActivity = $risActivity->concat($icsActivity)->concat($parActivity)
        ->sortByDesc(fn($a) => strtotime($a['date']))
        ->take(5)
        ->values();

    $totalStockPerCategory = $categories->map(function ($category) {
        $qty = Inventory::whereHas('po.details.prDetail.product.supplier_category', function ($query) use ($category) {
            $query->where('id', $category->id);
        })->sum('total_stock');

        return [
            'category' => $category->name,
            'qty' => $qty,
        ];
    });

    return Inertia::render('Supply/Dashboard', [
        'stats' => [
            [
                'label' => 'Total Stock Items',
                'value' => $totalStock,
                'icon' => 'Boxes',
                'color' => 'bg-blue-100 text-blue-600'
            ],
            [
                'label' => 'Pending Deliveries',
                'value' => $pendingDeliveries,
                'icon' => 'Truck',
                'color' => 'bg-yellow-100 text-yellow-600'
            ],
            [
                'label' => 'Total Issued Items',
                'value' => $totalIssued,
                'icon' => 'PackageCheck',
                'color' => 'bg-green-100 text-green-600'
            ],
        ],
        'documents' => [
            [
                'label'=> "RIS (Requisition)", 
                'value'=> $totalRis, 
                'icon'=> 'ClipboardList', 
                'link'=> "supply_officer.ris_issuance", 
                'color'=> "bg-purple-100 text-purple-600" 
            ],
            [
                'label'=> "ICS (High)", 
                'value'=> $totalIcsHigh, 
                'icon'=> 'FileSpreadsheet', 
                'link'=> "supply_officer.ics_issuance_high", 
                'color'=> "bg-pink-100 text-pink-600" 
            ],
            [
                'label'=> "ICS (Low)", 
                'value'=> $totalIcsLow, 
                'icon'=> 'FileSpreadsheet', 
                'link'=> "supply_officer.ics_issuance_low", 
                'color'=> "bg-indigo-100 text-indigo-600" 
            ],
            [
                'label'=> "PAR", 
                'value'=> $totalPar, 
                'icon'=> 'FileCheck', 
                'link'=> "supply_officer.par_issuance", 
                'color'=> "bg-orange-100 text-orange-600" 
            ],
            [
                'label'=> "Purchase Orders", 
                'value'=> $totalPo, 
                'icon'=> 'FileText', 
                'link'=> "supply_officer.purchase_orders", 
                'color'=> "bg-teal-100 text-teal-600" 
            ],
            [
                'label'=> "Issuance Logs", 
                'value'=> $totalIssued, 
                'icon'=> 'Layers', 
                'link'=> "supply_officer.ris_issuance", 
                'color'=> "bg-sky-100 text-sky-600" 
            ],
        ],
        'stockData' => $totalStockPerCategory,
        'recentActivity' => $recentActivity,
        'user' => $user
    ]);
}

public function purchase_orders(Request $request){
    $search = $request->input('search');
    $division = $request->input('division');

    $purchaseRequests = PurchaseRequest::with([
        'division',
        'focal_person',
        'details.product.unit',
        'rfqs.details.supplier'
    ])
    ->whereHas('rfqs.details', fn ($q) => $q->where('is_winner', true))
    ->when($search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
            $q->where('pr_number', 'like', "%$search%")
              ->orWhereHas('focal_person', fn ($q2) =>
                  $q2->where('firstname', 'like', "%$search%")
                     ->orWhere('lastname', 'like', "%$search%")
              );
        });
    })
    ->when($division, fn ($q) => $q->where('division_id', $division))
    ->paginate(10)
    ->withQueryString();

    // Get all RFQ IDs that already have POs
    $poRfqs = PurchaseOrder::pluck('rfq_id')->toArray();

    // Add a `has_po` property for each PR
    $purchaseRequests->getCollection()->transform(function ($pr) use ($poRfqs) {
        $rfqIds = $pr->rfqs->pluck('id')->toArray();
        $pr->has_po = count(array_intersect($rfqIds, $poRfqs)) > 0;
        return $pr;
    });

    $divisions = Division::select('id', 'division')->get();

    return Inertia::render('Supply/PurchaseOrder', [
        'purchaseRequests' => $purchaseRequests,
        'filters' => [
            'search' => $search,
            'division' => $division,
            'divisions' => $divisions,
        ],
    ]);
}



    public function create_po($prId){
        $pr = PurchaseRequest::with(['details.product.unit', 'focal_person', 'division'])
        ->findOrFail($prId);

        $rfq = RFQ::with(['details.supplier'])->where('pr_id', $prId)->firstOrFail();


        $winners = $rfq->details
            ->filter(fn($d) => $d->is_winner)
            ->map(function ($winner) use ($pr) {
                $prDetail = $pr->details->firstWhere('id', $winner->pr_details_id);

                return [
                    'pr_detail_id' => $winner->pr_details_id,
                    'item' => $prDetail->product->name ?? 'N/A',
                    'specs' => $prDetail->product->specs ?? '',
                    'quantity' => $prDetail->quantity,
                    'unit' => $prDetail->product->unit->unit ?? '',
                    'quoted_price' => $winner->quoted_price,
                    'supplier_id' => $winner->supplier_id,
                    'supplier_name' => $winner->supplier->company_name ?? '',
                ];
            })->values();

        $allQuotations = [];
        foreach ($rfq->details as $detail) {
            $allQuotations[$detail->supplier_id][$detail->pr_details_id] = $detail->quoted_price;
        }

        return Inertia::render('Supply/CreatePurchaseOrder', [
            'pr' => $pr,
            'rfq' => $rfq,
            'winners' => $winners,
            'supplier' => Supplier::find($winners->first()['supplier_id'] ?? null),
            'suppliers' => Supplier::all(['id', 'company_name']),
            'supplierQuotedPrices' => $allQuotations, 
        ]);
    }

public function store_po(Request $request)
{
    $request->validate([
        'rfq_id' => 'required|exists:tbl_rfqs,id',
        'items' => 'required|array|min:1',
        'items.*.pr_detail_id' => 'required|exists:tbl_pr_details,id',
        'items.*.quantity' => 'required|numeric|min:0',
        'items.*.unit_price' => 'required|numeric|min:0',
        'items.*.total_price' => 'required|numeric|min:0',
    ]);

    DB::transaction(function () use ($request) {
        $firstPrDetailId = $request->items[0]['pr_detail_id'];
        $purchaseRequest = PurchaseRequest::with(['focal_person', 'details'])
            ->whereHas('details', function ($q) use ($firstPrDetailId) {
                $q->where('id', $firstPrDetailId);
            })->firstOrFail();

        $userId = is_object($purchaseRequest->focal_person)
            ? $purchaseRequest->focal_person->id
            : $purchaseRequest->focal_person;

        if (!$userId) {
            throw new \Exception("Focal person not assigned to this Purchase Request.");
        }

        // --- Group items by supplier ---
        $itemsBySupplier = collect($request->items)->groupBy('supplier_id');

        $basePoNumber = $purchaseRequest->pr_number; // e.g. 25-09-001
        $suffix = 'a';

        foreach ($itemsBySupplier as $supplierId => $supplierItems) {
            // If only one supplier won, use base PO number (no suffix)
            $poNumber = $itemsBySupplier->count() === 1
                ? $basePoNumber
                : $basePoNumber . $suffix++;

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'rfq_id' => $request->rfq_id,
                'supplier_id' => $supplierId,
                'user_id' => $userId,
                'status' => 'Not yet Delivered',
            ]);

            foreach ($supplierItems as $item) {
                $prDetail = $purchaseRequest->details->firstWhere('id', $item['pr_detail_id']);
                $user = Auth::user();

                // Audit log if qty differs
                if ($prDetail && $prDetail->quantity != $item['quantity']) {
                    AuditLogs::create([
                        'action' => 'quantity_changed',
                        'entity_type' => 'PurchaseOrder',
                        'entity_id' => $po->id,
                        'changes' => json_encode([
                            'pr_detail_id' => $prDetail->id,
                            'pr_qty' => $prDetail->quantity,
                            'po_qty' => $item['quantity'],
                        ]),
                        'reason' => $item['change_reason'] ?? null,
                        'user_id' => $user->id,
                    ]);
                }

                PurchaseOrderDetail::create([
                    'po_id' => $po->id,
                    'pr_detail_id' => $item['pr_detail_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);
            }
        }
    });

    return redirect()
        ->route('supply_officer.purchase_orders_table')
        ->with('success', 'Purchase Order(s) successfully created with auditing.');
}



    public function purchase_orders_table(Request $request){
        $search = $request->input('search');
        $division = $request->input('division');

        $query = PurchaseOrder::with([
            'supplier',
            'rfq.purchaseRequest.division',
            'rfq.purchaseRequest.focal_person',
            'iar'
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                ->orWhereHas('rfq.purchaseRequest.focal_person', function ($q2) use ($search) {
                    $q2->where('firstname', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%");
                });
            });
        }

        if ($division) {
            $query->whereHas('rfq.purchaseRequest.division', function ($q) use ($division) {
                $q->where('id', $division);
            });
        }

        $purchaseOrders = $query->orderByDesc('created_at')->paginate(10)->withQueryString();

        return Inertia::render('Supply/PurchaseOrdersTable', [
            'purchaseOrders' => $purchaseOrders,
            'filters' => [
                'search' => $search,
                'division' => $division,
                'divisions' => Division::select('id', 'division')->get(),
            ],
        ]);
    }

    public function print_po($id)
    {
        $po = PurchaseOrder::with([
            'rfq.purchaseRequest.focal_person',
            'rfq.purchaseRequest.details.product.unit',
            'supplier',
            'details' 
        ])->findOrFail($id);

        return Inertia::render('Supply/PrintPurchaseOrder', [
            'po' => $po,
        ]);
    }

    public function record_iar($id){
        $committee = InspectionCommittee::with('members')
        ->where('inspection_committee_status', 'active')
        ->first();
        $po = PurchaseOrder::with([
            'rfq.purchaseRequest.focal_person',
            'rfq.purchaseRequest.details.product.unit',
            'supplier',
            'details' 
        ])->findOrFail($id);
        return Inertia::render('Supply/RecordIar', [
            'po' => $po,
            'inspectionCommittee' => $committee
        ]);
    }
public function store_iar(Request $request)
{
    $po = PurchaseOrder::with([
        'rfq',
        'rfq.purchaseRequest',
        'rfq.purchaseRequest.focal_person',
        'details.prDetail.product.unit',
    ])->findOrFail($request->po_id);

    try {
        $po->update([
            'status' => 'Inspected and Delivered',
        ]);
    } catch (Exception $e) {
        dd($e->getMessage());
    }

    // ✅ Validate using correct inspection_committee_id
    $validated = $request->validate([
        'po_id'                      => 'required|exists:tbl_purchase_orders,id',
        'iar_number'                 => 'required|string|max:20',
        'date_received'              => 'required|date',
        'inspection_committee_id'    => 'required|exists:tbl_inspection_committees,id', // ✅ fixed
        'items'                      => 'required|array|min:1',
        'items.*.pr_details_id'      => 'required|exists:tbl_pr_details,id',
        'items.*.specs'              => 'required|string|max:255',
        'items.*.quantity_ordered'   => 'required|numeric|min:0',
        'items.*.quantity_received'  => 'required|numeric|min:0',
        'items.*.unit_price'         => 'required|numeric|min:0',
        'items.*.total_price'        => 'required|numeric|min:0',
        'items.*.remarks'            => 'required|string|max:255',
    ]);

    $userId = Auth::id();
    $focalPersonId = optional($po->rfq->purchaseRequest->focal_person)->id ?? $userId;

    foreach ($validated['items'] as $item) {
        $unitId = $po->details
            ->firstWhere('pr_detail_id', $item['pr_details_id'])
            ?->prDetail?->product?->unit?->id;

        if (!$unitId) {
            return back()->withErrors([
                'unit' => "Unable to determine unit for item: {$item['specs']}"
            ]);
        }

        // ✅ Create IAR record
        IAR::create([
            'po_id'                  => $validated['po_id'],
            'iar_number'             => $validated['iar_number'],
            'specs'                  => $item['specs'],
            'quantity_ordered'       => $item['quantity_ordered'],
            'quantity_received'      => $item['quantity_received'],
            'unit'                   => $unitId,
            'unit_price'             => $item['unit_price'],
            'total_price'            => $item['total_price'],
            'remarks'                => $item['remarks'] ?? "",
            'inspection_committee_id'=> $validated['inspection_committee_id'], // ✅ fixed
            'date_received'          => $validated['date_received'],
        ]);

        // ✅ Save to Inventory
        Inventory::create([
            'recorded_by'   => $userId,
            'requested_by'  => $focalPersonId,
            'po_id'         => $validated['po_id'],
            'item_desc'     => $item['specs'],
            'total_stock'   => $item['quantity_received'],
            'unit_id'          => $unitId,
            'unit_cost'     => $item['unit_price'],
            'last_received' => $validated['date_received'],
            'status'        => 'Available',
        ]);
    }

    return redirect()->route('supply_officer.purchase_orders_table')
        ->with('success', 'IAR and Inventory successfully recorded.');
}

public function replaceMember(Request $request, $id)
{
    $validated = $request->validate([
        'member_id' => 'required|exists:tbl_inspection_committee_members,id',
        'replacementName' => 'required|string|max:255',
    ]);

    $committee = InspectionCommittee::findOrFail($id);

    $member = InspectionCommitteeMember::where('id', $validated['member_id'])
        ->where('inspection_committee_id', $committee->id)
        ->where('status', 'active')
        ->firstOrFail();

    // deactivate old member
    $member->update(['status' => 'inactive']);

    // create new member
    $newMember = InspectionCommitteeMember::create([
        'inspection_committee_id' => $committee->id,
        'position' => $member->position,
        'name' => $validated['replacementName'],
        'status' => 'active',
    ]);

    return back()->with('success', 'Inspection Committee updated successfully!');
}




public function iar_table(Request $request)
{
    $search = $request->input('search');

    $iar = IAR::with([
        'purchaseOrder.details.prDetail.product.unit',
        'purchaseOrder.supplier',
        'purchaseOrder.rfq.purchaseRequest.division',
        'purchaseOrder.rfq.purchaseRequest.focal_person',
    ])
    ->when($search, function ($query, $search) {
        $query->where('iar_number', 'like', "%$search%")
              ->orWhereHas('purchaseOrder.supplier', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%$search%")
                    ->orWhere('representative_name', 'like', "%$search%");
              });
    })
    ->paginate(10)
    ->withQueryString();

    return Inertia::render('Supply/TableIar', [
        'iarData' => $iar,
        'filters' => [
            'search' => $search
        ]
    ]);
}



public function print_iar($id)
{
    $iar = IAR::with([
        'purchaseOrder.details',
        'purchaseOrder.details.prDetail.product.unit',
        'purchaseOrder.supplier',
        'purchaseOrder.rfq.purchaseRequest.division'
        ]
    )->findOrFail($id);

    return Inertia::render('Supply/PrintIar', [
        'iarData' => $iar,
    ]);
}
public function inventory(Request $request)
{
    $search = $request->input('search');
    $status = $request->input('status');
    $dateReceived = $request->input('date_received');

    $inventory = Inventory::with([
        'recordedBy',
        'unit',
        'requestedBy',
        'po'
    ])
    ->when($search, function ($query, $search) {
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
    ->paginate(10)
    ->withQueryString();

    return Inertia::render('Supply/Inventory', [
        'inventoryData' => $inventory,
        'filters' => [
            'search' => $search,
            'status' => $status,
            'date_received' => $dateReceived,
        ],
    ]);
}

public function issuance($po_id, $inventory_id) // <-- Accepts both IDs
{
    // --- STEP 1: Find the specific items we are working with ---
    $inventoryItem = Inventory::findOrFail($inventory_id);
    $po = PurchaseOrder::with([
        'details.prDetail.product.category',
        'details.prDetail.product.unit',
        'details.prDetail.purchaseRequest.division',
        'details.prDetail.purchaseRequest.focal_person',
        'supplier'
    ])->findOrFail($po_id);


    // --- STEP 2: Find the EXACT detail within the PO that matches the inventory item ---
    // This is the core of the fix. We no longer just take the `first()` item.
    $correctDetail = null;
    foreach ($po->details as $detail) {
        // dd([
        //     'message' => "Comparing inventory item to PO detail...",
        //     'INVENTORY_ITEM_DESC' => $inventoryItem->item_desc,
        //     'PO_DETAIL_SPECS' => $detail->prDetail->product->specs,
        //     'ARE_THEY_EQUAL?' => $detail->prDetail->product->specs === $inventoryItem->item_desc,
        //     'INVENTORY_UNIT_ID' => $inventoryItem->unit,
        //     'PO_DETAIL_UNIT_ID' => $detail->prDetail->product->unit_id,
        //     'ARE_UNITS_EQUAL?' => $detail->prDetail->product->unit_id === $inventoryItem->unit,
        // ]);
        // Find the detail whose product specs and unit match the inventory item
        if (
            $detail->prDetail && $detail->prDetail->product &&
            $detail->prDetail->product->unit_id === $inventoryItem->unit_id
        ) {
            $correctDetail = $detail;
            break; // Stop searching once we find the match
        }
    }

    
    // --- STEP 3: Run the logic on the CORRECT item's data ---
    $product = $correctDetail->prDetail->product;
    $categoryName = strtolower($product->category->name ?? '');
    $totalPricePO = $correctDetail->total_price; // Use the total price of the correct item

    // --- STEP 4: Prepare clean props and render ---
    // (This uses the robust "flattened props" pattern from our previous discussion)
    $props = [
        'purchaseOrder' => [
            'id' => $po->id,
            'po_number' => $po->po_number,
            // We only need to send the one correct detail to the form
            'details' => [$correctDetail], // Send as an array with one item
        ],
        'inventoryItem' => $inventoryItem,
        'user' => Auth::user(),
    ];
    
    // --- STEP 5: Render the correct form based on the CORRECT item's properties ---
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

    public function store_ris(Request $request){
        $validated = $request->validate([
            'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
            'inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
            'ris_number' => 'required|string|max:20',
            'issued_to' => 'required|integer|exists:users,id',
            'issued_by' => 'required|integer|exists:users,id',
            'quantity' => 'required|numeric|min:0.01',
            'remarks' => 'string|max:255'
        ]);

        DB::beginTransaction();
        try{
            $inventory = Inventory::findOrFail($validated['inventory_item_id']);

            if ($inventory->total_stock < $validated['quantity']) {
                return back()->withErrors(['quantity' => 'Not enough stock available.']);
            }
            $ris = RIS::create([
                'po_id' => $validated['po_id'],
                'ris_number' => $validated['ris_number'],
                'inventory_item_id' => $validated['inventory_item_id'],
                'issued_to' => $validated['issued_to'],
                'issued_by' => $validated['issued_by'],
                'quantity' => $validated['quantity'],
                'remarks' => $validated['remarks'],
            ]);
            $inventory->total_stock -= $validated['quantity'];
            if ($inventory->total_stock <= 0) {
                $inventory->status = 'Issued';
            } else {
                $inventory->status = 'Available';
            }
            $inventory->save();

            DB::commit();
            return redirect()->route('supply_officer.ris_issuance')->with('success', 'RIS successfully recorded.');
        }catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Failed to store RIS. ' . $e->getMessage()]);
        }
    }
public function ris_issuance(Request $request)
{
    $search = $request->input('search');

    // Load POs with all needed relationships
    $purchaseOrders = PurchaseOrder::with([
        'details.prDetail.product.category',
        'details.prDetail.product.unit',
        'details.prDetail.purchaseRequest.division',
        'details.prDetail.purchaseRequest.focal_person',
    ])->latest()->paginate(10);
    

    // Collect all products
    $products = $purchaseOrders->flatMap(fn($po) => 
        $po->details->pluck('prDetail.product')
    )->filter();


    // Batch fetch inventory
    $inventoryItems = Inventory::whereIn('item_desc', $products->pluck('specs'))
    ->whereIn('unit_id', $products->pluck('unit_id'))
    ->get();
$ris = RIS::with(['issuedTo', 'issuedBy', 'inventoryItem', 'po'])->paginate(10);

    return Inertia::render('Supply/Ris', [
        'ris' => $ris,
        'purchaseOrders' => $purchaseOrders,
        'inventoryItems' => $inventoryItems,
        'user' => Auth::user(),
    ]);
}


    public function store_ics(Request $request)
    {
        $validated = $request->validate([
            'po_id' => 'required|integer|exists:tbl_purchase_orders,id',
            'inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
            'ics_number' => 'required|string|max:20',
            'received_by' => 'required|integer|exists:users,id',
            'received_from' => 'required|integer|exists:users,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0.01',
            'total_cost' => 'required|numeric|min:0.01',
            'remarks' => 'string|max:255'
        ]);

        DB::beginTransaction();
        try {
            $inventory = Inventory::with('po.details.prDetail.product.category')
                ->findOrFail($validated['inventory_item_id']);

            if ($inventory->total_stock < $validated['quantity']) {
                return back()->withErrors(['quantity' => 'Not enough stock available.']);
            }

            $type = null;

            // Get the first product category name from PO details
            $categoryName = optional(
                $inventory->po->details->first()?->prDetail?->product?->category
            )->name;

            if ($categoryName === 'Semi-Expendable') {
                $type = $validated['unit_cost'] < 5000 ? 'low' : 'high';
            }

            

            $ics = ICS::create([
                'po_id' => $validated['po_id'],
                'ics_number' => $validated['ics_number'],
                'inventory_item_id' => $validated['inventory_item_id'],
                'received_by' => $validated['received_by'],
                'received_from' => $validated['received_from'],
                'quantity' => $validated['quantity'],
                'unit_cost' => $validated['unit_cost'],
                'total_cost' => $validated['total_cost'],
                'remarks' => $validated['remarks'],
                'type' => $type,
            ]);

            // Update stock status
            $inventory->total_stock -= $validated['quantity'];
            $inventory->status = $inventory->total_stock <= 0 ? 'Issued' : 'Available';
            $inventory->save();

            DB::commit();

            // Redirect based on type
            if ($type === 'low') {
                return redirect()->route('supply_officer.ics_issuance_low')
                    ->with('success', 'ICS (Low) successfully recorded.');
            } elseif ($type === 'high') {
                return redirect()->route('supply_officer.ics_issuance_high')
                    ->with('success', 'ICS (High) successfully recorded.');
            }


        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Failed to store ICS. ' . $e->getMessage()]);
        }
    }
    public function store_par(Request $request)
{
    $validated = $request->validate([
        'po_id'             => 'required|integer|exists:tbl_purchase_orders,id',
        'inventory_item_id' => 'required|integer|exists:tbl_inventory,id',
        'par_number'        => 'required|string|max:20',
        'received_by'       => 'required|integer|exists:users,id',
        'issued_by'         => 'required|integer|exists:users,id',
        'quantity'          => 'required|numeric|min:0.01',
        'unit_cost'         => 'required|numeric|min:0.01',
        'total_cost'        => 'required|numeric|min:0.01',
        'property_no'       => 'nullable|string|max:50',
        'remarks'           => 'nullable|string|max:255',
        'date_acquired'     => 'nullable|date',
    ]);

    DB::beginTransaction();
    try {
        $inventory = Inventory::with('po.details.prDetail.product.category')
            ->findOrFail($validated['inventory_item_id']);

        if ($inventory->total_stock < $validated['quantity']) {
            return back()->withErrors(['quantity' => 'Not enough stock available.']);
        }

        // Determine if PAR type depends on category (optional)
        $type = null;
        $categoryName = optional(
            $inventory->po->details->first()?->prDetail?->product?->category
        )->name;

        if ($categoryName === 'Property') {
            $type = 'property';
        }

        // Create PAR record
        $par = PAR::create([
            'po_id'             => $validated['po_id'],
            'par_number'        => $validated['par_number'],
            'inventory_item_id' => $validated['inventory_item_id'],
            'received_by'       => $validated['received_by'],
            'issued_by'         => $validated['issued_by'],
            'quantity'          => $validated['quantity'],
            'unit_cost'         => $validated['unit_cost'],
            'total_cost'        => $validated['total_cost'],
            'property_no'       => $validated['property_no'] ?? null,
            'remarks'           => $validated['remarks'] ?? null,
            'date_acquired'     => $validated['date_acquired'] ?? null,
            'type'              => $type,
        ]);

        // Update stock
        $inventory->total_stock -= $validated['quantity'];
        $inventory->status = $inventory->total_stock <= 0 ? 'Issued' : 'Available';
        $inventory->save();

        DB::commit();

        return redirect()->route('supply_officer.par_issuance')
            ->with('success', 'PAR successfully recorded.');

    } catch (\Exception $e) {
        DB::rollback();
        return back()->withErrors(['error' => 'Failed to store PAR. ' . $e->getMessage()]);
    }
}


    public function ics_issuance_low(Request $request){
        $search = $request->input('search');

        // Get ALL POs with nested relationships
        $purchaseOrders = PurchaseOrder::with([
            'details.prDetail.product.category', 
            'details.prDetail.product.unit',
            'details.prDetail.purchaseRequest.division',
            'details.prDetail.purchaseRequest.focal_person'
        ])->paginate(10);
        $ics = ICS::with(['receivedBy', 'receivedFrom', 'inventoryItem', 'po'])->latest()->paginate(10);

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
    $icsQuery = ICS::query()
        ->where('type', 'high')
        ->with([
            'po.rfq.purchaseRequest.division',
            'po.rfq.purchaseRequest.focal_person',
            'inventoryItem.unit',
            'receivedBy',
        ]);

    // --- APPLY ALL FILTERS ON THE SERVER ---
    
    // Search Filter
    if ($request->filled('search')) {
        $search = $request->input('search');
        $icsQuery->where(function ($query) use ($search) {
            $query->where('ics_number', 'like', "%{$search}%")
                  ->orWhereHas('inventoryItem', function ($q) use ($search) {
                      $q->where('item_desc', 'like', "%{$search}%");
                  });
        });
    }

    // Month Filter
    if ($request->filled('month')) {
        $icsQuery->whereMonth('created_at', $request->input('month'));
    }

    // Year Filter
    if ($request->filled('year')) {
        $icsQuery->whereYear('created_at', $request->input('year'));
    }

    $icsRecords = $icsQuery->latest()->latest()->paginate(10);

    return Inertia::render('Supply/IcsHigh', [
        'icsRecords' => $icsRecords,
        'user' => Auth::user(),
        // Send all active filters back to the component
        'filters' => $request->only(['search', 'month', 'year']),
    ]);
}
    public function par_issuance(Request $request){
        $search = $request->input('search');

        // Get ALL POs with nested relationships
        $purchaseOrders = PurchaseOrder::with([
            'details.prDetail.product.category', 
            'details.prDetail.product.unit',
            'details.prDetail.purchaseRequest.division',
            'details.prDetail.purchaseRequest.focal_person'
        ])->latest()->paginate(10);
        $par = PAR::query()
        ->with([
            'po.rfq.purchaseRequest.division',
            'po.rfq.purchaseRequest.focal_person',
            'inventoryItem.unit',
            'receivedBy',
        ])->paginate(10);

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
