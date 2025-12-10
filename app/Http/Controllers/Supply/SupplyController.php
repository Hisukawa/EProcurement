<?php

namespace App\Http\Controllers\Supply;

use App\Exports\RISExport;
use App\Exports\RISExportMonthly;
use App\Http\Controllers\Controller;
use App\Models\AuditLogs;
use App\Models\Disposed;
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
use App\Models\Reissued;
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
    $totalIcsHigh = ICS::whereHas('items', fn($q) => $q->where('type', 'high'))->count();
    $totalIcsLow = ICS::whereHas('items', fn($q) => $q->where('type', 'low'))->count();
    $totalPar = PAR::count();
    $totalIssued = $totalIcs + $totalRis + $totalPar;
    $totalPo = PurchaseOrder::count();
    $user = Auth::user();

    // --------------------------
    // Recent Activity
    // --------------------------
    $risActivity = RIS::with(['requestedBy', 'issuedBy', 'items.inventoryItem'])
        ->latest('created_at')->take(10)->get()
        ->flatMap(fn($r) => $r->items->map(fn($item) => [
            'id' => $r->ris_number,
            'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
            'status' => 'Processed',
            'date' => $item->created_at->format('M d, Y'),
        ]));

    $icsActivity = ICS::with('items.inventoryItem')
        ->latest('created_at')->take(10)->get()
        ->flatMap(fn($i) => $i->items->map(fn($item) => [
            'id' => $i->ics_number,
            'action' => "Received {$item->quantity} {$item->inventoryItem->item_desc}",
            'status' => 'Processed',
            'date' => $item->created_at->format('M d, Y'),
        ]));

    $parActivity = PAR::with('items.inventoryItem')
        ->latest('created_at')->take(10)->get()
        ->flatMap(fn($p) => $p->items->map(fn($item) => [
            'id' => $p->par_number,
            'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
            'status' => 'Processed',
            'date' => $item->created_at->format('M d, Y'),
        ]));
    $risIssued = DB::table('tbl_ris as ris')
        ->join('tbl_purchase_orders as po', 'po.id', '=', 'ris.po_id')
        ->join('tbl_rfqs as rfq', 'rfq.id', '=', 'po.rfq_id')
        ->join('tbl_purchase_requests as pr', 'pr.id', '=', 'rfq.pr_id')
        ->join('tbl_divisions as d', 'd.id', '=', 'pr.division_id')
        ->select('d.division as division', DB::raw('COUNT(ris.id) as total'))
        ->groupBy('d.division')
        ->get()
        ->map(fn($r) => [
            'division' => $r->division ?? 'Unassigned',
            'total' => $r->total,
            'type' => 'RIS',
        ]);

    // 🟩 ICS-issued per division
    $icsIssued = DB::table('tbl_ics as ics')
        ->join('tbl_purchase_orders as po', 'po.id', '=', 'ics.po_id')
        ->join('tbl_rfqs as rfq', 'rfq.id', '=', 'po.rfq_id')
        ->join('tbl_purchase_requests as pr', 'pr.id', '=', 'rfq.pr_id')
        ->join('tbl_divisions as d', 'd.id', '=', 'pr.division_id')
        ->select('d.division as division', DB::raw('COUNT(ics.id) as total'))
        ->groupBy('d.division')
        ->get()
        ->map(fn($i) => [
            'division' => $i->division ?? 'Unassigned',
            'total' => $i->total,
            'type' => 'ICS',
        ]);

    // 🟨 PAR-issued per division
    $parIssued = DB::table('tbl_par as par')
        ->join('tbl_purchase_orders as po', 'po.id', '=', 'par.po_id')
        ->join('tbl_rfqs as rfq', 'rfq.id', '=', 'po.rfq_id')
        ->join('tbl_purchase_requests as pr', 'pr.id', '=', 'rfq.pr_id')
        ->join('tbl_divisions as d', 'd.id', '=', 'pr.division_id')
        ->select('d.division as division', DB::raw('COUNT(par.id) as total'))
        ->groupBy('d.division')
        ->get()
        ->map(fn($p) => [
            'division' => $p->division ?? 'Unassigned',
            'total' => $p->total,
            'type' => 'PAR',
        ]);

    // 🧩 Combine all 3
    $issuedPerDivision = collect()
        ->merge($risIssued)
        ->merge($icsIssued)
        ->merge($parIssued)
        ->groupBy('division')
        ->map(fn($group) => [
            'division' => $group->first()['division'],
            'total' => $group->sum('total'),
            'breakdown' => [
                'RIS' => $group->where('type', 'RIS')->sum('total'),
                'ICS' => $group->where('type', 'ICS')->sum('total'),
                'PAR' => $group->where('type', 'PAR')->sum('total'),
            ],
        ])
        ->values();

    $recentActivity = $risActivity->concat($icsActivity)->concat($parActivity)
        ->sortByDesc(fn($a) => strtotime($a['date']))
        ->take(5)
        ->values();

    // --------------------------
    // Disposed / Reissued Stats
    // --------------------------
    $disposedCount = Disposed::withCount('items')->get()->sum('items_count');
    $reissuedCount = Reissued::withCount('items')->get()->sum('items_count');

    $disposedTotalCost = Disposed::with('items')->get()
        ->sum(fn($d) => $d->items->sum('total_cost'));

    $reissuedTotalCost = Reissued::with('items')->get()
        ->sum(fn($r) => $r->items->sum('total_cost'));

    // --------------------------
    // Dashboard Render
    // --------------------------
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
            [
                'label' => 'Disposed Items',
                'value' => $disposedCount,
                'icon' => 'Trash2',
                'color' => 'bg-red-100 text-red-600'
            ],
            [
                'label' => 'Reissued Items',
                'value' => $reissuedCount,
                'icon' => 'RefreshCcw',
                'color' => 'bg-teal-100 text-teal-600'
            ],
        ],

        'documents' => [
            [
                'label' => "RIS (Requisition)",
                'value' => $totalRis,
                'icon' => 'ClipboardList',
                'link' => "supply_officer.ris_issuance",
                'color' => "bg-purple-100 text-purple-600"
            ],
            [
                'label' => "ICS (High)",
                'value' => $totalIcsHigh,
                'icon' => 'FileSpreadsheet',
                'link' => "supply_officer.ics_issuance_high",
                'color' => "bg-pink-100 text-pink-600"
            ],
            [
                'label' => "ICS (Low)",
                'value' => $totalIcsLow,
                'icon' => 'FileSpreadsheet',
                'link' => "supply_officer.ics_issuance_low",
                'color' => "bg-indigo-100 text-indigo-600"
            ],
            [
                'label' => "PAR",
                'value' => $totalPar,
                'icon' => 'FileCheck',
                'link' => "supply_officer.par_issuance",
                'color' => "bg-orange-100 text-orange-600"
            ],
            [
                'label' => "Issuance Logs",
                'value' => $totalIssued,
                'icon' => 'Layers',
                'link' => "supply_officer.ris_issuance",
                'color' => "bg-sky-100 text-sky-600"
            ],
        ],
        'issuedPerDivision' => $issuedPerDivision,
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
        'mode_of_procurement' => 'required|string|max:255',
        'delivery_term' => 'nullable|string|max:255',
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
                'mode_of_procurement' => $request->mode_of_procurement,
                'delivery_term' => $request->delivery_term,
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
        ->route('bac_user.bac_purchase_orders_table')
        ->with('success', 'Purchase Order(s) successfully created with auditing.');
}

    public function bac_purchase_orders_table(Request $request){
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

        return Inertia::render('BacApprover/PurchaseOrdersTable', [
            'purchaseOrders' => $purchaseOrders,
            'filters' => [
                'search' => $search,
                'division' => $division,
                'divisions' => Division::select('id', 'division')->get(),
            ],
        ]);
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
        $iarNumber = $this->generateIARNumber();
        return Inertia::render('Supply/RecordIar', [
            'po' => $po,
            'inspectionCommittee' => $committee,
            'iarNumber' => $iarNumber
        ]);
    }

private function generateIARNumber()
{
    $year = now()->format('y');
    $month = now()->format('m');

    // Get the latest IAR record for the current year and month
    $lastIAR = IAR::whereYear('created_at', now()->year)
        ->latest('id')
        ->first();

    if ($lastIAR && preg_match('/\d{2}-\d{2}-(\d{3})$/', $lastIAR->iar_number, $matches)) {
        // Extract the last 3 digits and increment by 1
        $lastSeries = (int) $matches[1];
        $nextSeries = $lastSeries + 1;
    } else {
        // No existing record for this month/year
        $nextSeries = 1;
    }

    // Pad with zeros (e.g., 001, 002, 010)
    $series = str_pad($nextSeries, 3, '0', STR_PAD_LEFT);

    // Final format e.g. "25-11-002"
    return "{$year}-{$month}-{$series}";
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

        $unitFromPr = $prDetail?->unit;
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
            'iar_number'              => $po->po_number,
            'specs'                   => trim(($poDetail->prDetail->item ?? 'N/A')) . ' - ' . $item['specs'],
            'quantity_ordered'        => $item['quantity_ordered'],
            'quantity_received'       => $item['quantity_received'],
            'unit_id'                 => $unit->id,  // Use the unit name from PR
            'unit_price'              => $item['unit_price'],
            'total_price'             => $item['total_price'],
            'remarks'                 => $item['remarks'] ?? "",
            'inspection_committee_id' => $validated['inspection_committee_id'],
            'date_received'           => $validated['date_received'],
            'recorded_by'             => $userId,
            'source_type'             => 'po',
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
            'source_type'   => 'po',
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

    // Fetch all matching IAR rows with relationships
    $iarItems = IAR::with([
        'purchaseOrder.supplier',
        'purchaseOrder.rfq.purchaseRequest.division',
    ])
    ->when($search, function ($query, $search) {
        $query->where('iar_number', 'like', "%$search%")
              ->orWhereHas('purchaseOrder.supplier', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%$search%")
                    ->orWhere('representative_name', 'like', "%$search%");
              });
    })
    ->orderBy('created_at', 'desc')
    ->get();

    // Group by IAR number
    $grouped = $iarItems->groupBy('iar_number')->map(function($group) {
        $first = $group->first();
        return [
            'iar_number'            => $first->iar_number,
            'supplier'              => $first->purchaseOrder->supplier->company_name ?? 'N/A',
            'division'              => $first->purchaseOrder->rfq->purchaseRequest->division->division ?? 'N/A',
            'inspection_committee'  => $first->inspection_committee_id ?? 'N/A',
            'items'                 => $group->pluck('specs')->toArray(), // ✅ send all specs
            'totalPrice'            => $group->sum(fn($item) => ($item->quantity_received ?? 0) * ($item->unit_price ?? 0)),
            'id'                    => $first->id,
        ];
    })->values();

    // Manual pagination
    $page = $request->input('page', 1);
    $perPage = 10;
    $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
        $grouped->forPage($page, $perPage),
        $grouped->count(),
        $perPage,
        $page,
        ['path' => url()->current(), 'query' => $request->query()]
    );

    return Inertia::render('Supply/TableIar', [
        'iarData' => $paginated,
        'filters' => ['search' => $search],
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
        'purchaseOrder.rfq.purchaseRequest.division',
        'unit'
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

public function suppliers(Request $request)
{
    $search = $request->input('search');

    $suppliers = Supplier::when($search, function ($query, $search) {
        $query->where('company_name', 'like', "%$search%")
              ->orWhere('representative_name', 'like', "%$search%");
    })
    ->orderBy('company_name')
    ->paginate(10)
    ->withQueryString();

    return Inertia::render('Supply/Suppliers', [
        'records' => $suppliers,
        'filters' => [
            'search' => $search,
        ],
    ]);
}

    public function update_supplier(Request $request, $id)
    {
        // Validate the incoming data
        $validatedData = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'tin_num' => 'required|string|max:50',
            'representative_name' => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:255',
        ]);

        // Find the supplier by ID
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return redirect()->back()->with('error', 'Supplier not found.');
        }

        // Update supplier data
        $supplier->company_name = $validatedData['company_name'];
        $supplier->address = $validatedData['address'];
        $supplier->tin_num = $validatedData['tin_num'];
        $supplier->representative_name = $validatedData['representative_name'];
        $supplier->contact_number = $validatedData['contact_number'] ?? $supplier->contact_number;
        $supplier->email = $validatedData['email'] ?? $supplier->email;

        // Save the changes
        $supplier->save();

        // Return success response
        return redirect()->route('supply_officer.suppliers')->with('success', 'Supplier updated successfully!');
    }
        public function delete_supplier($id)
    {
        // Find the supplier by ID
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return redirect()->back()->with('error', 'Supplier not found.');
        }

        // Mark supplier as inactive
        $supplier->status = 'inactive';  // Assuming you have a 'status' field in your suppliers table
        $supplier->save();

        // Return success response
        return redirect()->route('supply_officer.suppliers')->with('success', 'Supplier marked as inactive.');
    }

    public function activate_supplier($id)
    {
        // Find the supplier by ID
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return redirect()->back()->with('error', 'Supplier not found.');
        }

        // Mark supplier as inactive
        $supplier->status = 'active';  // Assuming you have a 'status' field in your suppliers table
        $supplier->save();

        // Return success response
        return redirect()->route('supply_officer.suppliers')->with('success', 'Supplier marked as active.');
    }

    public function add_supplier(Request $request)
    {
        // ✅ Validate inputs
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'tin_num' => 'required|string|max:50|unique:tbl_suppliers,tin_num',
            'representative_name' => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:255|unique:tbl_suppliers,email',
        ]);

        // ✅ Use Eloquent create() method (mass assignment)
        $supplier = Supplier::create([
            'company_name' => $validated['company_name'],
            'address' => $validated['address'],
            'tin_num' => $validated['tin_num'],
            'representative_name' => $validated['representative_name'],
            'contact_number' => $validated['contact_number'] ?? null,
            'email' => $validated['email'] ?? null,
            'status' => 'active', // default active
        ]);

        // ✅ Redirect with message
        return redirect()
            ->route('supply_officer.suppliers')
            ->with('success', "{$supplier->company_name} has been successfully added.");
    }



}
