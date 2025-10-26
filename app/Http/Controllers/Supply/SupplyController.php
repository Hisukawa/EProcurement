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
use App\Models\Unit;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class SupplyController extends Controller
{
    public function dashboard() 
    {
$totalStock = Inventory::sum('total_stock');
$pendingDeliveries = PurchaseOrder::where("status", "Not yet Delivered")->count();
$totalIcs = ICS::count();
$totalRis = RIS::count();
$totalIcsHigh = ICS::whereHas('items', function($query) {
    $query->where('type', 'high');
})->count();

$totalIcsLow = ICS::whereHas('items', function($query) {
    $query->where('type', 'low');
})->count();

$totalPar = PAR::count();

$totalIssued = $totalIcs + $totalRis + $totalPar;
$totalPo = PurchaseOrder::count();

$user = Auth::user();

// ---- FIXED: RIS Activity ----
$risActivity = RIS::with(['requestedBy', 'issuedBy', 'items.inventoryItem'])
    ->latest('created_at')
    ->take(10) // take more in case multiple items per RIS
    ->get()
    ->flatMap(function($r) {
        return $r->items->map(function($item) use ($r) {
            return [
                'id' => $r->ris_number,
                'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
                'status' => 'Processed',
                'date' => $item->created_at->format('M d, Y'),
            ];
        });
    });

// ---- FIXED: ICS Activity ----
$icsActivity = ICS::with('items.inventoryItem')
    ->latest('created_at')
    ->take(10)
    ->get()
    ->flatMap(function($i) {
        return $i->items->map(function($item) use ($i) {
            return [
                'id' => $i->ics_number,
                'action' => "Received {$item->quantity} {$item->inventoryItem->item_desc}",
                'status' => 'Processed',
                'date' => $item->created_at->format('M d, Y'),
            ];
        });
    });

// ---- FIXED: PAR Activity ----
$parActivity = PAR::with('items.inventoryItem')
    ->latest('created_at')
    ->take(10)
    ->get()
    ->flatMap(function($p) {
        return $p->items->map(function($item) use ($p) {
            return [
                'id' => $p->par_number,
                'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
                'status' => 'Processed',
                'date' => $item->created_at->format('M d, Y'),
            ];
        });
    });

// ---- Combine all recent activity ----
$recentActivity = $risActivity->concat($icsActivity)->concat($parActivity)
    ->sortByDesc(fn($a) => strtotime($a['date']))
    ->take(5)
    ->values();



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
            'recentActivity' => $recentActivity,
            'user' => $user
        ]);
    }

public function purchase_orders(Request $request)
{
    $search   = $request->input('search');
    $division = $request->input('division');

    $purchaseRequests = PurchaseRequest::with([
        'division',
        'focal_person',
        'details.product.unit',
        'rfqs.details.supplier',
        'rfqs.details.prDetail' // make sure we eager-load PR details for quantity
    ])
    ->latest('created_at')
    ->whereHas('rfqs.details', fn ($q) => $q->where('is_winner_as_calculated', true))
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

    $purchaseRequests->getCollection()->transform(function ($pr) use ($poRfqs) {
        $rfqIds   = $pr->rfqs->pluck('id')->toArray();
        $pr->has_po = count(array_intersect($rfqIds, $poRfqs)) > 0;

        // Winners info (same logic as create_po)
        $pr->winners = $pr->rfqs
            ->flatMap(fn($rfq) => $rfq->details)
            ->filter(fn($d) => $d->is_winner_as_calculated)
            ->map(fn($w) => [
                'pr_detail_id'  => $w->pr_details_id,
                'supplier_id'   => $w->supplier_id,
                'supplier_name' => $w->supplier->company_name ?? 'N/A',
                'quantity'      => $w->pr_detail->quantity ?? 0,
                'unit_price'    => $w->unit_price_edited ?? $w->quoted_price ?? 0,
                'total_price'   => ($w->unit_price_edited ?? $w->quoted_price ?? 0) * ($w->pr_detail->quantity ?? 0),
                'price_source'  => $w->unit_price_edited ? 'As Calculated Price' : 'Quoted Price',
                'item'          => $w->pr_detail->item ?? '',
                'specs'         => $w->pr_detail->specs ?? '',
                'unit'          => $w->pr_detail->unit ?? '',
            ])
            ->values();

        // Supplier totals (mirrors create_po)
        $pr->rfq_totals = $pr->rfqs
            ->map(function ($rfq) {
                $supplierTotals = $rfq->details
                    ->groupBy('supplier_id')
                    ->map(function ($details) {
                        return $details->sum(function ($d) {
                            $unitPrice = $d->unit_price_edited ?? $d->quoted_price ?? 0;
                            $qty       = $d->pr_detail?->quantity ?? 0;
                            return $unitPrice * $qty;
                        });
                    });

                return [
                    'rfq_id'   => $rfq->id,
                    'suppliers'=> $supplierTotals
                ];
            });

        return $pr;
    });

    $divisions = Division::select('id', 'division')->get();

    return Inertia::render('Supply/PurchaseOrder', [
        'purchaseRequests' => $purchaseRequests,
        'filters' => [
            'search'   => $search,
            'division' => $division,
            'divisions'=> $divisions,
        ],
    ]);
}

public function create_po($prId)
{
    
    $pr = PurchaseRequest::with([
        'details.product.unit',
        'focal_person',
        'division'
    ])->findOrFail($prId);

    $rfq = RFQ::with(['details.supplier'])
        ->where('pr_id', $prId)
        ->firstOrFail();

    // Precompute supplier totals (per awarded items)
    $supplierTotals = $rfq->details
        ->groupBy('supplier_id')
        ->map(function ($details) {
            return $details->sum(function ($d) {
                $unitPrice = $d->unit_price_edited ?? $d->quoted_price ?? 0;
                $qty       = $d->pr_detail?->quantity ?? 0;
                return $unitPrice * $qty;
            });
        });

    $winners = $rfq->details
        ->filter(fn($d) => $d->is_winner_as_calculated)
        ->map(function ($winner) use ($pr, $rfq, $supplierTotals) {
            $prDetail  = $pr->details?->firstWhere('id', $winner->pr_details_id);
            $unitPrice = $winner->unit_price_edited ?? $winner->quoted_price ?? 0;
            $quantity  = $prDetail?->quantity ?? 0;

            return [
                'pr_detail_id'   => $winner->pr_details_id,
                'item'           => $prDetail?->item ?? 'N/A',
                'specs'          => $prDetail?->specs ?? '',
                'quantity'       => $quantity,
                'unit'           => $prDetail?->unit ?? '',
                'unit_price'     => $unitPrice,
                'total_price'    => $unitPrice * $quantity,
                'supplier_id'    => $winner->supplier_id,
                'supplier_name'  => $winner->supplier->company_name ?? '',
                'mode'           => $rfq->mode ?? 'as-read',
                'supplier_total' => $supplierTotals[$winner->supplier_id] ?? 0,
            ];
        })
        ->values();

    return inertia('Supply/CreatePurchaseOrder', [
        'pr'        => $pr,
        'rfq'       => $rfq,
        'suppliers' => $rfq->details->pluck('supplier')->unique('id')->values(),
        'winners'   => $winners,
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
            ->whereHas('details', fn($q) => $q->where('id', $firstPrDetailId))
            ->firstOrFail();

        $userId = is_object($purchaseRequest->focal_person)
            ? $purchaseRequest->focal_person->id
            : $purchaseRequest->focal_person;

        if (!$userId) {
            throw new \Exception("Focal person not assigned to this Purchase Request.");
        }

        $itemsBySupplier = collect($request->items)->groupBy('supplier_id');

        $basePoNumber = $purchaseRequest->pr_number;
        $suffix = 'a';

        $rfq = RFQ::findOrFail($request->rfq_id);

        foreach ($itemsBySupplier as $supplierId => $supplierItems) {
            $poNumber = $itemsBySupplier->count() === 1
                ? $basePoNumber
                : $basePoNumber . $suffix++;

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'rfq_id' => $request->rfq_id,
                'supplier_id' => $supplierId,
                'user_id' => $userId,
                'recorded_by' => Auth::id(),
                'status' => 'Not yet Delivered',
            ]);

            foreach ($supplierItems as $item) {
                $prDetail = $purchaseRequest->details->firstWhere('id', $item['pr_detail_id']);
                $user = Auth::user();

                // Audit log if quantity differs from PR
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
                    'unit_price' => $item['unit_price'],  // supports edited price
                    'total_price' => $item['total_price'], // already computed on frontend
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

        $pdf = Pdf::loadView('pdf.purchase_order', compact('po'))
            ->setPaper('A4', 'portrait'); // or 'landscape' if needed

        return $pdf->stream('purchase_order_' . $po->po_number . '.pdf');
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

    // ✅ Validation
    $validated = $request->validate([
        'po_id'                      => 'required|exists:tbl_purchase_orders,id',
        'iar_number'                 => 'required|string|max:20',
        'date_received'              => 'required|date',
        'inspection_committee_id'    => 'required|exists:tbl_inspection_committees,id',
        'items'                      => 'required|array|min:1',
        'items.*.pr_details_id'      => 'required|exists:tbl_pr_details,id',
        'items.*.specs'              => 'required|string|max:255',
        'items.*.quantity_ordered'   => 'required|numeric|min:0',
        'items.*.quantity_received'  => 'required|numeric|min:0',
        'items.*.unit_price'         => 'required|numeric|min:0',
        'items.*.total_price'        => 'required|numeric|min:0',
        'items.*.remarks'            => 'nullable|string|max:255',
    ]);

    $userId = Auth::id();
    $focalPersonId = optional($po->rfq->purchaseRequest->focal_person)->id ?? $userId;

    foreach ($validated['items'] as $item) {
        // 🔎 Match PR detail from this PO
        $poDetail = $po->details->firstWhere('pr_detail_id', $item['pr_details_id']);
        $prDetail = $poDetail?->prDetail;

        // Fetch the unit from the associated Purchase Request (PR)
        $unitFromPr = $prDetail?->unit;  // Get the unit from the PR Detail

        // If the unit is not found in PR, show error message
        if (!$unitFromPr) {
            return back()->withErrors([
                'unit' => "Unable to determine unit for item: {$item['specs']}. No unit found in Purchase Request."
            ]);
        }

        // Retrieve the unit ID from the unit name (string) from PR
        $unit = Unit::where('unit', $unitFromPr)->first();  // Find the unit by the name in the PR

        if (!$unit) {
            return back()->withErrors([
                'unit' => "Unit '{$unitFromPr}' not found in the units table."
            ]);
        }

        // ✅ Save to IAR
        IAR::create([
            'po_id'                   => $validated['po_id'],
            'iar_number'              => $validated['iar_number'],
            'specs'                   => $item['specs'],
            'quantity_ordered'        => $item['quantity_ordered'],
            'quantity_received'       => $item['quantity_received'],
            'unit'                    => $unit->id,  // Use the unit name from PR
            'unit_price'              => $item['unit_price'],
            'total_price'             => $item['total_price'],
            'remarks'                 => $item['remarks'] ?? "",
            'inspection_committee_id' => $validated['inspection_committee_id'],
            'date_received'           => $validated['date_received'],
            'recorded_by'             => $userId
        ]);

        // ✅ Save to Inventory using `po_detail_id` instead of `po_id`
        Inventory::create([
            'po_detail_id'  => $poDetail->id, // correct
            'recorded_by'   => $userId,
            'requested_by'  => $focalPersonId,
            'quantity'      => $item['quantity_received'],
            'unit_id'       => $unit->id,   // Use the unit ID from the unit found in the units table
            'unit_cost'     => $item['unit_price'],
            'last_received' => $validated['date_received'],
            'status'        => 'Available',
            'item_desc'     => trim(($poDetail->prDetail->item ?? 'N/A') . ' - ' . ($poDetail->prDetail->specs ?? '')),
            'total_stock'   => $item['quantity_received'],
        ]);
    }

    return redirect()
        ->route('supply_officer.iar_table')
        ->with('success', 'Inventory updated successfully.');
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
    ])->latest('created_at')
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
    $committee = InspectionCommittee::with('members')
        ->where('inspection_committee_status', 'active')
        ->first();
    $iar = IAR::with([
        'purchaseOrder.details',
        'purchaseOrder.details.prDetail.product.unit',
        'purchaseOrder.supplier',
        'purchaseOrder.rfq.purchaseRequest.division'
    ])->findOrFail($id);

    // Generate PDF from Blade
    $pdf = Pdf::loadView('pdf.print_iar', ['iarData' => $iar, 'inspectors' => $committee])
              ->setPaper('A4', 'portrait'); // can use 'landscape'

    // Stream or Download
    return $pdf->stream('IAR-'.$iar->iar_number.'.pdf');
    // return $pdf->download('IAR-'.$iar->iar_number.'.pdf');
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

}
