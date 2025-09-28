<?php

namespace App\Http\Controllers\Approver;

use App\Http\Controllers\Controller;
use App\Models\AuditLogs;
use App\Models\BacCommittee;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestDetail;
use App\Models\RFQ;
use App\Models\RFQDetail;
use App\Models\RFQSupplierTotal;
use App\Models\Supplier;
use App\Models\User;
use App\Notifications\PurchaseRequestApproved;
use App\Notifications\PurchaseRequestSentBack;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;

class ApproverController extends Controller
{
    public function dashboard(){
        $totalPr = PurchaseRequest::count();
        $approved = PurchaseRequest::where("status", "approved")->count();
        $pending = PurchaseRequest::where("status", "pending")->count();
        $rejected = PurchaseRequest::where("status", "rejected")->count();

        $deptData = PurchaseRequest::with('division')
            ->get()
            ->groupBy(fn($pr) => $pr->division->division)
            ->map(function ($prs, $divisionName) {
                return [
                    'division' => $divisionName,
                    'approved' => $prs->filter(fn($pr) => strtolower($pr->status) === 'approved')->count(),
                    'pending'  => $prs->filter(fn($pr) => strtolower($pr->status) === 'pending')->count(),
                    'rejected' => $prs->filter(fn($pr) => strtolower($pr->status) === 'rejected')->count(),
                ];
            })
            ->values()
            ->all();
        $recentApprovals = PurchaseRequest::with('details')
            ->orderBy('created_at')
            ->take(5)
            ->get()
            ->map(function($pr){
                return[
                    'pr_number' => $pr->pr_number,
                    'items' => $pr->details->pluck('item')->join(', '),
                    'status' => $pr->status,
                    'date' => $pr->created_at->format('M d, Y')
                ];
            });
        
        return Inertia::render('BacApprover/Dashboard',[
            'stats' => [
                [
                    'label' => 'Total Requests',
                    'value' => $totalPr,
                    'icon' => 'ClipboardList',
                    'color' => 'bg-blue-100 text-blue-600',
                ],
                [
                    'label' => 'Approved',
                    'value' => $approved,
                    'icon' => 'CheckCircle2',
                    'color' => 'bg-green-100 text-green-600',
                ],
                [
                    'label' => 'Pending',
                    'value' => $pending,
                    'icon' => 'Hourglass',
                    'color' => 'bg-yellow-100 text-yellow-600',
                ],
                [
                    'label' => 'Rejected',
                    'value' => $rejected,
                    'icon' => 'XCircle',
                    'color' => 'bg-red-100 text-red-600',
                ],
            ],
            'deptData' => $deptData,
            'approvalData' => [
                [
                    'name' => 'Approved',
                    'value' => $approved,
                    'color' => '#16a34a'
                ],
                [
                    'name' => 'Pending',
                    'value' => $pending,
                    'color' => '#eab308'
                ],
                [
                    'name' => 'Rejected',
                    'value' => $rejected,
                    'color' => '#dc2626'
                ],
            ],
            'recentApprovals' => $recentApprovals
        ]);
    }

public function purchase_requests(Request $request)
{
    $query = PurchaseRequest::with(['details', 'division', 'focal_person']);

    if ($request->filled('prNumber')) {
        $query->where('pr_number', 'like', '%' . $request->input('prNumber') . '%');
    }

    if ($request->filled('focalPerson')) {
        $query->whereHas('focal_person', function ($q) use ($request) {
            $search = $request->input('focalPerson');
            $q->whereRaw("CONCAT(firstname, ' ', lastname) LIKE ?", ["%{$search}%"]);
        });
    }


    if ($request->filled('division')) {
        $query->where('division_id', $request->input('division'));
    }

    $purchaseRequests = $query->latest()->paginate(10)->withQueryString();

    return Inertia::render('BacApprover/PurchaseRequests', [
        'purchaseRequests' => $purchaseRequests,
        'filters' => $request->only(['prNumber', 'focalPerson', 'division']),
    ]);
}

public function for_review(Request $request)
{
    $query = PurchaseRequest::with(['details', 'division', 'focal_person'])
        ->where('is_sent', 1)
        ->where('status', 'pending');

    if ($request->filled('prNumber')) {
        $query->where('pr_number', 'like', '%' . $request->input('prNumber') . '%');
    }

    if ($request->filled('focalPerson')) {
        $query->whereHas('focal_person', function ($q) use ($request) {
            $q->where('firstname', 'like', '%' . $request->input('focalPerson') . '%')
              ->orWhere('lastname', 'like', '%' . $request->input('focalPerson') . '%');
        });
    }

    if ($request->filled('division')) {
        $query->where('division_id', $request->input('division'));
    }

    $sentPRs = $query->latest()->paginate(10)->withQueryString();

    return Inertia::render('BacApprover/ForReview', [
        'sentPurchaseRequests' => $sentPRs,
        'filters' => $request->only(['prNumber', 'focalPerson', 'division']),
    ]);
}


    public function approve(PurchaseRequest $pr)
    {
        try {
            $pr->update([
                'status' => 'Approved',
            ]);
            if ($pr->focal_person) {
            $pr->focal_person->notify(new PurchaseRequestApproved($pr));
        }
        } catch (Exception $e) {
            dd($e->getMessage());
        }

        return back()->with('success', 'PR sent back with reason.');
    }

    public function show_details($id)
    {
        $pr = PurchaseRequest::with(['details.product.unit', 'division', 'focal_person'])
            ->findOrFail($id);

        return Inertia::render('BacApprover/ViewDetails', [
            'pr' => [
                
                'id' => $pr->id,
                'focal_person' => $pr->focal_person,
                'pr_number' => $pr->pr_number,
                'purpose' => $pr->purpose,
                'status' => $pr->status,
                'approval_image' => $pr->approval_image,
                'created_at' => $pr->created_at,
                'requester_name' => $pr->requested_by ?? 'N/A',
                'division' => $pr->division->division ?? 'N/A',
                'details' => $pr->details->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'item' => $detail->product->name ?? '',
                        'specs' => $detail->product->specs ?? '',
                        'unit' => $detail->product->unit->unit ?? '',
                        'quantity' => $detail->quantity,
                        'unit_price' => $detail->unit_price,
                        'total_price' => $detail->quantity * $detail->unit_price,
                    ];
                }),
            ],
        ]);
    }
public function approved_requests(Request $request)
{
    $query = PurchaseRequest::with(['details', 'division', 'focal_person', 'rfqs'])
        ->where('status', 'Approved');

    if ($request->filled('prNumber')) {
        $query->where('pr_number', 'like', '%' . $request->input('prNumber') . '%');
    }

    if ($request->filled('focalPerson')) {
        $query->whereHas('focal_person', function ($q) use ($request) {
            $q->where('firstname', 'like', '%' . $request->input('focalPerson') . '%')
              ->orWhere('lastname', 'like', '%' . $request->input('focalPerson') . '%');
        });
    }

    if ($request->filled('division')) {
        $query->where('division_id', $request->input('division'));
    }

    $purchaseRequests = $query->latest()->paginate(10)->withQueryString();

    return Inertia::render('BacApprover/Approved', [
        'purchaseRequests' => $purchaseRequests,
        'filters' => $request->only(['prNumber', 'focalPerson', 'division']),
    ]);
}

    


public function store_rfq(Request $request)
{
    $validated = $request->validate([
        'pr_id' => 'required|integer|exists:tbl_purchase_requests,id',
        'user_id' => 'required|integer|exists:users,id',
        'selections' => 'required|array|min:1',
        'selections.*.pr_detail_id' => 'required|integer|exists:tbl_pr_details,id',
        'selections.*.supplier_id' => 'required|integer|exists:tbl_suppliers,id',
        'selections.*.estimated_bid' => 'required|numeric|min:0',
    ]);

    // Create or get existing RFQ for this PR and user
    $rfq = RFQ::firstOrCreate([
        'pr_id' => $validated['pr_id'],
        'user_id' => $validated['user_id'],
    ]);

    foreach ($validated['selections'] as $selection) {
        // Check if this combination already exists (item + supplier)
        $exists = RFQDetail::where('rfq_id', $rfq->id)
            ->where('pr_details_id', $selection['pr_detail_id'])
            ->where('supplier_id', $selection['supplier_id'])
            ->exists();

        if (!$exists) {
            RFQDetail::create([
                'rfq_id' => $rfq->id,
                'pr_details_id' => $selection['pr_detail_id'],
                'supplier_id' => $selection['supplier_id'],
                'estimated_bid' => $selection['estimated_bid'],
            ]);
        }
    }

    return redirect()->back()->with('success', 'RFQ submitted successfully!')->with('reload', true);
}



public function generate_rfq($id)
{
    $pr = PurchaseRequest::with(['details.product.unit', 'details.product', 'division', 'focal_person'])
        ->findOrFail($id);

    $suppliers = Supplier::get();

    $rfqs = RFQ::with([
        'details.supplier',
        'details.prDetail.product'
    ])->where('pr_id', $id)->get();


    return Inertia::render('BacApprover/GenerateRFQ', [
        'purchaseRequest' => $pr,
        'pr' => [
            'id' => $pr->id,
            'pr_number' => $pr->pr_number,
            'purpose' => $pr->purpose,
            'status' => $pr->status,
            'approval_image' => $pr->approval_image,
            'created_at' => $pr->created_at,
            'requester_name' => $pr->requested_by ?? 'N/A',
            'division' => $pr->division->division ?? 'N/A',
            'details' => $pr->details->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'item' => $detail->product->name ?? '',
                    'specs' => $detail->product->specs ?? '',
                    'unit' => $detail->product->unit->unit ?? '',
                    'quantity' => $detail->quantity,
                    'unit_price' => $detail->unit_price,
                    'total_price' => $detail->quantity * $detail->unit_price,

                    // THIS IS THE FIX: Pass the entire product object along with its relationships.
                    'product' => $detail->product,
                ];
            }),
        ],
        'suppliers' => $suppliers,
        'rfqs' => $rfqs,
    ]);
}
public function store_supplier(Request $request)
{
    // ✅ Validate incoming request
    $validated = $request->validate([
        'company_name'        => 'required|string|max:255',
        'address'             => 'nullable|string|max:255',
        'tin_num'             => 'nullable|string|max:50',
        'representative_name' => 'required|string|max:255',
    ]);

    try {
        $supplier = Supplier::create($validated);

        $supplier = Supplier::find($supplier->id);

        return response()->json([
            'message'  => 'Supplier created successfully.',
            'supplier' => $supplier,
        ], 201);


    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Something went wrong while saving supplier.',
            'details' => $e->getMessage(), // remove in production
        ], 500);
    }
}


public function print_rfq($prId)
{
    $pr = PurchaseRequest::with(['details.product.unit'])->findOrFail($prId);
    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    $details = $pr->details->map(function ($detail) {
        return [
            'id' => $detail->id,
            'item' => $detail->product->name ?? '',
            'specs' => $detail->product->specs ?? '',
            'unit' => $detail->product->unit->unit ?? '',
            'quantity' => $detail->quantity,
            'unit_price' => $detail->unit_price,
            'total_price' => $detail->quantity * $detail->unit_price,
        ];
    });

    // PASS absolute filesystem path for Dompdf
    $logo = public_path('deped1.png');
    if (!file_exists($logo)) {
        // fallback to null or alternative image
        $logo = null;
    }

    $pdf = Pdf::loadView('pdf.rfq', [
        'rfq' => $pr,
        'details' => $details,
        'logo' => $logo,
        'committee' => $committee
    ]);

    return $pdf->stream("PR-{$pr->id}-RFQ.pdf");
}
public function print_rfq_selected(Request $request, $prId)
{
    $itemIds = $request->query('items', []);

    $pr = PurchaseRequest::with(['details.product.unit'])
        ->findOrFail($prId);

    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    // Filter details by selected IDs
    $details = $pr->details
        ->whereIn('id', $itemIds)
        ->map(function ($detail) {
            return [
                'id' => $detail->id,
                'item' => $detail->product->name ?? '',
                'specs' => $detail->product->specs ?? '',
                'unit' => $detail->product->unit->unit ?? '',
                'quantity' => $detail->quantity,
                'unit_price' => $detail->unit_price,
                'total_price' => $detail->quantity * $detail->unit_price,
            ];
        });

    // If no details matched (empty selection), fallback to all
    if ($details->isEmpty()) {
        $details = $pr->details->map(function ($detail) {
            return [
                'id' => $detail->id,
                'item' => $detail->product->name ?? '',
                'specs' => $detail->product->specs ?? '',
                'unit' => $detail->product->unit->unit ?? '',
                'quantity' => $detail->quantity,
                'unit_price' => $detail->unit_price,
                'total_price' => $detail->quantity * $detail->unit_price,
            ];
        });
    }

    // Logo absolute path
    $logo = public_path('deped1.png');
    if (!file_exists($logo)) {
        $logo = null;
    }

    $pdf = Pdf::loadView('pdf.rfq', [
        'rfq' => $pr,
        'details' => $details,
        'logo' => $logo,
        'committee' => $committee
    ]);

    return $pdf->stream("PR-{$pr->id}-RFQ-Selected.pdf");
}




public function for_quotations(Request $request)
{
    $query = PurchaseRequest::with([
        'details',
        'division',
        'focal_person',
        'rfqs.details'
    ])->where('status', 'Approved');

    if ($request->filled('prNumber')) {
        $query->where('pr_number', 'like', '%' . $request->input('prNumber') . '%');
    }

    if ($request->filled('focalPerson')) {
        $query->whereHas('focal_person', function ($q) use ($request) {
            $q->where('firstname', 'like', '%' . $request->input('focalPerson') . '%')
              ->orWhere('lastname', 'like', '%' . $request->input('focalPerson') . '%');
        });
    }

    if ($request->filled('division')) {
        $query->where('division_id', $request->input('division'));
    }

    $purchaseRequests = $query->latest()->paginate(10)->withQueryString();

    return Inertia::render('BacApprover/Quotations', [
        'purchaseRequests' => $purchaseRequests,
        'filters' => $request->only(['prNumber', 'focalPerson', 'division']),
    ]);
}



    public function quoted_price($id)
{
    $pr = PurchaseRequest::with([
        'details.product.unit',
        'details.product',
        'division',
        'focal_person'
    ])->findOrFail($id);



    $rfqs = RFQ::where('pr_id', $id)->get();


    $supplierIds = $rfqs->flatMap(function ($rfq) {
        return $rfq->details->pluck('supplier_id');
    })->unique()->filter()->values(); 



    $suppliers = Supplier::get();
    


    $rfqDetails = $rfqs->flatMap(function ($rfq) {
        return $rfq->details->map(function ($detail) use ($rfq) {
            return [
                'rfq_id' => $rfq->id,
                'pr_details_id' => $detail->pr_details_id,
                'supplier_id' => $detail->supplier_id,
                'quoted_price' => $detail->quoted_price,
            ];
        });
    });

    return Inertia::render('BacApprover/EnterQuotedPrice', [
        'purchaseRequest' => $pr,
        'pr' => [
            'id' => $pr->id,
            'pr_number' => $pr->pr_number,
            'purpose' => $pr->purpose,
            'status' => $pr->status,
            'approval_image' => $pr->approval_image,
            'created_at' => $pr->created_at,
            'requester_name' => $pr->requested_by ?? 'N/A',
            'division' => $pr->division->division ?? 'N/A',
            'details' => $pr->details->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'item' => $detail->product->name ?? '',
                    'specs' => $detail->product->specs ?? '',
                    'unit' => $detail->product->unit->unit ?? '',
                    'quantity' => $detail->quantity,
                    'unit_price' => $detail->unit_price,
                    'total_price' => $detail->quantity * $detail->unit_price,
                ];
            }),

        ],
        'suppliers' => $suppliers,
        'rfqs' => $rfqs,
        'rfq_details' => $rfqDetails->values(),
    ]);
}


public function submit_quoted(Request $request)
{
    $user = Auth::user();

    $data = $request->validate([
        'pr_id' => ['required', 'exists:tbl_purchase_requests,id'],
        'pr_details_id' => ['required', 'exists:tbl_pr_details,id'],
        'supplier_id' => ['required', 'exists:tbl_suppliers,id'],
        'quoted_price' => ['nullable', 'numeric', 'min:0'],
        'rfq_id' => ['nullable', 'exists:tbl_rfqs,id'], // optional rfq_id
    ]);

    // Use provided rfq_id if exists and belongs to user, else create/find
    if (!empty($data['rfq_id'])) {
        $rfq = RFQ::where('id', $data['rfq_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$rfq) {
            return back()->withErrors(['rfq_id' => 'Invalid RFQ ID.']);
        }
    } else {
        $rfq = RFQ::firstOrCreate(
            [
                'pr_id' => $data['pr_id'],
                'user_id' => $user->id,
            ],
            [
                'grouped' => true,
            ]
        );
    }

    RFQDetail::updateOrCreate(
        [
            'rfq_id' => $rfq->id,
            'pr_details_id' => $data['pr_details_id'],
            'supplier_id' => $data['supplier_id'],
        ],
        [
            'quoted_price' => $data['quoted_price'],
        ]
    );

    return back()->with('success', 'Quoted price submitted successfully.');
}

public function submit_bulk_quoted(Request $request)
{
    $user = Auth::user();

    $data = $request->validate([
        'quotes' => 'required|array|min:1',
        'quotes.*.pr_id' => 'required|exists:tbl_purchase_requests,id',
        'quotes.*.pr_details_id' => 'required|exists:tbl_pr_details,id',
        'quotes.*.supplier_id' => 'required|exists:tbl_suppliers,id',
        'quotes.*.quoted_price' => 'nullable|numeric|min:0',
        'quotes.*.rfq_id' => 'nullable|exists:tbl_rfqs,id', // optional
    ]);

    foreach ($data['quotes'] as $quote) {
        // Use provided rfq_id if valid, else create/find
        if (!empty($quote['rfq_id'])) {
            $rfq = RFQ::where('id', $quote['rfq_id'])
                ->where('user_id', $user->id)
                ->first();

            if (!$rfq) {
                return back()->withErrors(['rfq_id' => 'Invalid RFQ ID.']);
            }
        } else {
            $rfq = RFQ::firstOrCreate(
                [
                    'pr_id' => $quote['pr_id'],
                    'user_id' => $user->id,
                ],
                [
                    'grouped' => true,
                ]
            );
        }
        RFQDetail::updateOrCreate(
            [
                'rfq_id' => $rfq->id,
                'pr_details_id' => $quote['pr_details_id'],
                'supplier_id' => $quote['supplier_id'],
            ],
            [
                'quoted_price' => $quote['quoted_price'],
            ]
        );
    }

    return back()->with('success', 'All quoted prices submitted successfully.');
}



    public function abstract_of_quotations($pr)
    {
        $rfq = RFQ::with([
            'purchaseRequest.focal_person',
            'purchaseRequest.division',
            'purchaseRequest.details',
        ])->where('pr_id', $pr)->firstOrFail();

        // Get RFQ details with supplier info
        $rfqDetails = RFQDetail::with('supplier')
            ->where('rfq_id', $rfq->id)
            ->get()
            ->groupBy('pr_details_id');
        $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

        return Inertia::render('BacApprover/AbstractOfQuotations', [
            'prId'=> $pr,
            'rfq' => $rfq,
            'groupedDetails' => $rfqDetails,
            'committee' => $committee,
            'award_mode' => $rfq->award_mode, // 🔑
        ]);

    }
    public function abstract_of_quotations_calculated($pr)
    {
        $rfq = RFQ::with([
            'purchaseRequest.focal_person',
            'purchaseRequest.division',
            'purchaseRequest.details',
        ])->where('pr_id', $pr)->firstOrFail();

        $rfqDetails = RFQDetail::with('supplier')
            ->where('rfq_id', $rfq->id)
            ->get()
            ->groupBy('pr_details_id');

        $committee = BacCommittee::with('members')
            ->where('committee_status', 'active')
            ->first();

        return Inertia::render('BacApprover/AbstractOfQuotationsCalculated', [
            'prId'=> $pr,
            'rfq' => $rfq,
            'groupedDetails' => $rfqDetails,
            'committee' => $committee,
            'award_mode' => $rfq->award_mode, 
        ]);
    }

    
public function markWinner(Request $request, $id)
{
    $request->validate([
        'supplier_id' => 'required|integer|exists:tbl_suppliers,id',
        'detail_id'   => 'nullable|integer|exists:tbl_rfq_details,id',
        'remarks'     => 'nullable|string',
    ]);

    $supplierId = $request->input('supplier_id');
    $remarks    = $request->input('remarks');
    $prDetailId = $request->input('detail_id');

    $rfq = RFQ::findOrFail($id);
    $rfq->mode = 'as-read'; // set as-read mode

    try {
        if ($prDetailId) {
            // --- PER-ITEM WINNER ---
            RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $prDetailId)
                ->update(['is_winner' => false]);

            $quote = RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $prDetailId)
                ->where('supplier_id', $supplierId)
                ->firstOrFail();

            $quote->is_winner = true;
            $quote->remarks   = $remarks;
            // leave quoted_price untouched
            $quote->save();

            $rfq->award_mode = 'per-item';
        } else {
            // --- WHOLE-PR WINNER ---
            RFQDetail::where('rfq_id', $id)->update([
                'is_winner' => false,
                'remarks'   => null,
            ]);

            RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->update([
                    'is_winner' => true,
                    'remarks'   => $remarks,
                    // leave quoted_price untouched
                ]);

            $rfq->award_mode = 'whole-pr';
        }

        $rfq->save();

        return response()->json([
            'success' => true,
            'message' => 'Winner updated successfully (as-read).',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to update winner: ' . $e->getMessage(),
        ], 500);
    }
}


// --- MARK WINNER (AS-CALCULATED) ---
public function markWinnerAsCalculated(Request $request, $id)
{
    $request->validate([
        'supplier_id'  => 'required|integer|exists:tbl_suppliers,id',
        'detail_id'    => 'nullable|integer|exists:tbl_rfq_details,id',
        'remarks'      => 'nullable|string',
        'custom_price' => 'nullable|numeric|min:0', // per-item
    ]);

    $supplierId  = $request->input('supplier_id');
    $remarks     = $request->input('remarks');
    $prDetailId  = $request->input('detail_id');
    $customPrice = $request->input('custom_price');

    $rfq = RFQ::findOrFail($id);
    $rfq->mode = 'as-calculated'; // Set mode

    try {
        if ($prDetailId) {
            // --- PER-ITEM WINNER ---
            RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $prDetailId)
                ->update(['is_winner' => false]);

            $quote = RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $prDetailId)
                ->where('supplier_id', $supplierId)
                ->firstOrFail();

            $quote->is_winner = true;
            $quote->remarks   = $remarks;
            $quote->unit_price_edited = $customPrice; // store custom per-item price
            $quote->save();

            $rfq->award_mode = 'per-item';
        } else {
            // --- WHOLE-PR WINNER ---
            RFQDetail::where('rfq_id', $id)->update([
                'is_winner' => false,
                'remarks'   => null,
            ]);

            RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->update([
                    'is_winner' => true,
                    'remarks'   => $remarks,
                ]);

            $rfq->award_mode = 'whole-pr';

            // Recalculate total_price_calculated for the winning supplier
            $total = RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->get()
                ->sum(function ($detail) {
                    return $detail->unit_price_edited ?? $detail->quoted_price ?? 0;
                });


            $rfq->total_price_calculated = $total;
        }

        $rfq->save();

        return response()->json([
            'success' => true,
            'message' => 'Winner updated successfully (as-calculated).',
            'total_price_calculated' => $rfq->total_price_calculated ?? null,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to update winner: ' . $e->getMessage(),
        ], 500);
    }
}



public function saveUnitPrice(Request $request, $rfq)
    {
        $request->validate([
            'supplier_id' => 'required|integer|exists:tbl_suppliers,id',
            'detail_id'   => 'required|integer|exists:tbl_rfq_details,id',
            'unit_price'  => 'required|numeric|min:0',
        ]);

        $supplierId = $request->input('supplier_id');
        $detailId   = $request->input('detail_id');
        $unitPrice  = $request->input('unit_price');

        try {
            // Update the specific RFQ detail's unit_price_edited
            $rfqDetail = RFQDetail::where('pr_details_id', $detailId)
                ->where('supplier_id', $supplierId)
                ->first();
                if (!$rfqDetail) {
                return response()->json([
                    'success' => false,
                    'message' => "RFQ Detail not found for supplier ID $supplierId and detail ID $detailId",
                ], 404);
            }

            $rfqDetail->unit_price_edited = $unitPrice;
            $rfqDetail->save();

            // Recalculate total_price_calculated for the RFQ
            $rfqModel = RFQ::findOrFail($rfq);
            $total = $rfqModel->details
                ->where('supplier_id', $supplierId) // only this supplier
                ->sum(function ($detail) {
                    return $detail->unit_price_edited ?? $detail->quoted_price ?? 0;
                });



            $rfqModel->total_price_calculated = $total;
            $rfqModel->save();

            return response()->json([
                'success' => true,
                'message' => 'Unit price updated',
                'total_price_calculated' => $total,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save unit price: ' . $e->getMessage(),
            ], 500);
        }
    }

public function saveRemarks(Request $request, $id, $prDetailId = null)
{
    
    $request->validate([
        'supplier_id' => 'required|integer',
        'remarks' => 'nullable|string|max:1000',
    ]);
    $supplierId = $request->input('supplier_id');
    $remarks = $request->input('remarks');


    if (!$supplierId) {
        return back()->with('error', 'A supplier was not specified.');
    }

    $rfq = RFQ::findOrFail($id);

    if ($prDetailId) {
        // 🔹 Update remarks for specific PR item + supplier
        $quote = RFQDetail::where('rfq_id', $id)
            ->where('pr_details_id', $prDetailId)
            ->where('supplier_id', $supplierId)
            ->first();

        if ($quote) {
            $quote->remarks = $remarks;
            $quote->save();
        } else {
            return back()->with('error', 'Could not find the specified quote.');
        }
    } else {
        // 🔹 Update remarks for all items from this supplier in the RFQ
        RFQDetail::where('rfq_id', $id)
            ->where('supplier_id', $supplierId)
            ->update(['remarks' => $remarks]);
    }

    return back()->with('success', 'Remarks have been successfully saved.');
}



public function rollbackWinner(Request $request, $id)
{
    $user = Auth::user();
    $request->validate([
        'remarks' => 'required|string',
        'mode'    => 'required|in:whole-pr,per-item',
        'detail_id' => 'nullable|integer'
    ]);

    $rfq = RFQ::with('details')->findOrFail($id);

    $changes = [];
    if ($request->mode === 'whole-pr') {
        $changes = $rfq->details()
            ->where('is_winner', true)
            ->get(['id', 'pr_details_id', 'supplier_id']);
        
        $rfq->details()->update(['is_winner' => false]);
        $rfq->award_mode = null; // reset award mode
        $rfq->save();

    } elseif ($request->mode === 'per-item' && $request->detail_id) {
        $changes = $rfq->details()
            ->where('pr_details_id', $request->detail_id)
            ->where('is_winner', true)
            ->get(['id', 'pr_details_id', 'supplier_id']);

        $rfq->details()
            ->where('pr_details_id', $request->detail_id)
            ->update(['is_winner' => false]);

        // Check if any winners left for this RFQ
        $hasAnyWinnerLeft = $rfq->details()->where('is_winner', true)->exists();
        if (!$hasAnyWinnerLeft) {
            $rfq->award_mode = null; // reset only if no more winners
            $rfq->save();
        }
    }

    AuditLogs::create([
        'action'       => 'rollback_winner',
        'entity_type'  => 'RFQ',
        'entity_id'    => $rfq->id,
        'changes'      => $changes->toJson(),
        'reason'       => $request->remarks,
        'user_id'      => $user->id,
    ]);

    return back()->with('success', 'Winner rollback successful.');
}




public function printAOQ($id, $pr_detail_id = null)
{
    $rfq = RFQ::with([
        'purchaseRequest.details',
        'details.supplier'
    ])->findOrFail($id);
    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    // ----------------------
    // PER-ITEM AOQ MODE
    // ----------------------
    if (!empty($pr_detail_id)) {
        $prDetail = $rfq->purchaseRequest
            ->details
            ->firstWhere('id', $pr_detail_id);

        if (!$prDetail) {
            abort(404, 'PR Detail not found.');
        }

        $quotes = $rfq->details
            ->where('pr_details_id', $pr_detail_id)
            ->sortBy('quoted_price')
            ->values();
        

        // Place winner on top if exists
        $winner = $quotes->firstWhere('is_winner', 1);
        if ($winner) {
            $quotes = collect([$winner])
                ->merge($quotes->where('id', '!=', $winner->id))
                ->values();
        }

        $pdf = Pdf::loadView('pdf.aoq_item', [
            'rfq'      => $rfq,
            'prDetail' => $prDetail,
            'quotes'   => $quotes,
            'committee' => $committee,
            'winner' => $winner
        ]);

        return $pdf->stream("AOQ_item_{$pr_detail_id}.pdf");
    }

    // ----------------------
    // FULL-PR AOQ MODE
    // ----------------------
    if ($rfq->award_mode === 'whole-pr') {
        $prItemCount = $rfq->purchaseRequest->details->count();

        $supplierTotals = $rfq->details
            ->groupBy('supplier_id')
            ->filter(function ($quotes) use ($prItemCount) {
                // Only keep suppliers who quoted ALL items
                return $quotes->pluck('pr_details_id')->unique()->count() === $prItemCount;
            })
            ->map(function ($quotes) {
                return [
                    'supplier'     => $quotes->first()->supplier,
                    'total_amount' => $quotes->sum('quoted_price'),
                    'is_winner'    => $quotes->contains('is_winner', 1),
                    'remarks' => $quotes->pluck('remarks')->filter()->unique()->implode(', '),

                ];
            })
            ->sortBy('total_amount')
            ->values();

        $pdf = Pdf::loadView('pdf.aoq_full', [
            'rfq'       => $rfq,
            'suppliers' => $supplierTotals,
            'committee' => $committee
        ]);

        return $pdf->stream("AOQ_full_{$id}.pdf");
    }

    // If not per-item or whole-pr mode
    abort(400, 'Invalid AOQ mode.');
}
public function printAOQCalculated($id, $pr_detail_id = null)
{
    $rfq = RFQ::with([
        'purchaseRequest.details',
        'details.supplier'
    ])->findOrFail($id);
    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    // ----------------------
    // PER-ITEM AOQ MODE
    // ----------------------
    if (!empty($pr_detail_id)) {
        $prDetail = $rfq->purchaseRequest
            ->details
            ->firstWhere('id', $pr_detail_id);

        if (!$prDetail) {
            abort(404, 'PR Detail not found.');
        }

        $quotes = $rfq->details
            ->where('pr_details_id', $pr_detail_id)
            ->sortBy('unit_price_edited') // sort by edited price
            ->values();
        

        // Place winner on top if exists
        $winner = $quotes->firstWhere('is_winner', 1);
        if ($winner) {
            $quotes = collect([$winner])
                ->merge($quotes->where('id', '!=', $winner->id))
                ->values();
        }

        $pdf = Pdf::loadView('pdf.aoq_item', [
            'rfq'      => $rfq,
            'prDetail' => $prDetail,
            'quotes'   => $quotes,
            'committee' => $committee,
            'winner' => $winner
        ]);

        return $pdf->stream("AOQ_item_{$pr_detail_id}.pdf");
    }

    // ----------------------
    // FULL-PR AOQ MODE
    // ----------------------
        if ($rfq->award_mode === 'whole-pr') {
            $prItemCount = $rfq->purchaseRequest->details->count();

            $supplierTotals = $rfq->details
        ->groupBy('supplier_id')
        ->filter(function ($quotes) use ($prItemCount) {
            // Only keep suppliers who quoted ALL items
            return $quotes->pluck('pr_details_id')->unique()->count() === $prItemCount;
        })
        ->map(function ($quotes) {
            return [
                'supplier'  => $quotes->first()->supplier,
                'total_amount' => $quotes->sum(function ($q) {
                    return $q->unit_price_edited ?? $q->quoted_price;
                }),
                'is_winner' => $quotes->contains('is_winner', 1),
                'remarks'   => $quotes->pluck('remarks')->filter()->unique()->implode(', '),
            ];
        })
        ->sortBy('total_amount')
        ->values();


        $pdf = Pdf::loadView('pdf.aoq_full_calculated', [
            'rfq'       => $rfq,
            'suppliers' => $supplierTotals,
            'committee' => $committee
        ]);

        return $pdf->stream("AOQ_full_{$id}.pdf");
    }

    // If not per-item or whole-pr mode
    abort(400, 'Invalid AOQ mode.');
}



public function send_back(Request $request, $id)
{
    $request->validate([
        'reason' => 'required|string|max:1000',
    ]);

    $pr = PurchaseRequest::findOrFail($id);

    // Update PR
    $pr->is_sent = false;
    $pr->send_back_reason = $request->reason; 
    $pr->save();

    // Find the requester (make sure focal_person_user is a valid user_id)
    $requester = User::findOrFail($pr->focal_person_user);

    // Send notification
    $requester->notify(new PurchaseRequestSentBack($pr, $request->reason));

    return back()->with('success', 'PR sent back with reason.');
}

public function delete_quoted(Request $request)
{
    $request->validate([
        'pr_id' => 'required|integer',
        'pr_details_id' => 'required|integer',
        'supplier_id' => 'required|integer',
    ]);

    try {
        $deleted = RFQDetail::whereHas('rfq', function ($q) use ($request) {
                $q->where('pr_id', $request->pr_id);
            })
            ->where('pr_details_id', $request->pr_details_id)
            ->where('supplier_id', $request->supplier_id)
            ->delete();

        if ($deleted) {
            return redirect()->back()->with([
                'status' => 'success',
                'message' => 'Quoted price deleted successfully.'
            ]);
        }

        return redirect()->back()->with([
            'status' => 'error',
            'message' => 'Quoted price not found.'
        ]);


    } catch (\Exception $e) {
        return redirect()->back()->with([
            'status' => 'error',
            'message' => 'Error deleting quoted price' . $e->getMessage(),
        ]);

    }
}


    public function save_committee(Request $request)
    {
        $data = $request->validate([
            'status' => 'required|string',
            'members' => 'required|array',
            'members.*.position' => 'required|string',
            'members.*.name' => 'nullable|string',
            'members.*.status' => 'required|string',
        ]);

        // Find or create committee
        $committee = BACCommittee::firstOrCreate([], [
            'committee_status' => $data['status'],
        ]);

        $committee->update(['committee_status' => $data['status']]);

        foreach ($data['members'] as $memberData) {
            // Find current active member for this position
            $existing = $committee->members()
                ->where('position', $memberData['position'])
                ->where('status', 'active')
                ->first();

            if ($existing) {
                if ($existing->name !== $memberData['name']) {
                    // Deactivate the old one
                    $existing->update(['status' => 'inactive']);

                    // Insert the new one
                    if (!empty($memberData['name'])) {
                        $committee->members()->create([
                            'position' => $memberData['position'],
                            'name'     => $memberData['name'],
                            'status'   => 'active',
                        ]);
                    }
                }
                // else do nothing (no change)
            } else {
                // No active member yet, create new
                if (!empty($memberData['name'])) {
                    $committee->members()->create([
                        'position' => $memberData['position'],
                        'name'     => $memberData['name'],
                        'status'   => 'active',
                    ]);
                }
            }
        }

        return back()->with('success', 'BAC Committee updated successfully!');
    }



}