<?php

namespace App\Http\Controllers\Approver;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\RFQ;
use App\Models\RFQDetail;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuotationController extends Controller
{
    public function for_quotations(Request $request)
{
    $query = PurchaseRequest::with([
        'details',
        'division',
        'focal_person',
        'rfqs.details'
    ])->where('status', 'Reviewed');

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
                    'item' => $detail->item ?? '',
                    'specs' => $detail->specs ?? '',
                    'unit' => $detail->unit ?? '',
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

}
