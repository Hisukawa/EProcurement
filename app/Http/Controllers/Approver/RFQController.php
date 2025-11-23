<?php

namespace App\Http\Controllers\Approver;

use App\Http\Controllers\Controller;
use App\Models\BacCommittee;
use App\Models\PurchaseRequest;
use App\Models\RFQ;
use App\Models\RFQDetail;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RFQController extends Controller
{
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
                    'item' => $detail->item ?? '',
                    'specs' => $detail->specs ?? '',
                    'unit' => $detail->unit ?? '',
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

public function saveData(Request $request)
{
    $validated = $request->validate([
        'bac_cn'          => 'nullable|string|max:255',
        'services'        => 'nullable|string|max:255',
        'location'        => 'nullable|string|max:255',
        'subject'         => 'nullable|string|max:255',
        'delivery_period' => 'nullable|string|max:255',
        'abc'             => 'required|string|max:255',
        'pr_id'           => 'required|exists:tbl_purchase_requests,id',
    ]);

        // Find the RFQ by the purchase request ID
        $rfq = RFQ::where('pr_id', $validated['pr_id'])->first();
        $user = Auth::user();
        if (!$rfq) {
            // If the RFQ doesn't exist, create a new one
            $rfq = new RFQ();
            $rfq->pr_id = $validated['pr_id'];
            $rfq->user_id = $user->id;
        }

        // Update the RFQ with the validated data
        $rfq->bac_cn = $validated['bac_cn'] ?? null;
        $rfq->services = $validated['services'] ?? null;
        $rfq->location = $validated['location'] ?? null;
        $rfq->subject = $validated['subject'] ?? null;
        $rfq->delivery_period = $validated['delivery_period'] ?? null;
        $rfq->abc = $validated['abc'];
    // Try to find existing RFQ
    $rfq = RFQ::where('pr_id', $validated['pr_id'])->first();

    if (!$rfq) {
        // Create new RFQ
        $rfq = new RFQ();
        $rfq->pr_id = $validated['pr_id']; // Required!
    }

    // Update RFQ fields
    $rfq->bac_cn         = $validated['bac_cn'] ?? null;
    $rfq->services       = $validated['services'] ?? null;
    $rfq->location       = $validated['location'] ?? null;
    $rfq->subject        = $validated['subject'] ?? null;
    $rfq->delivery_period = $validated['delivery_period'] ?? null;
    $rfq->abc            = $validated['abc'];

    $rfq->save(); // <= This WILL write the record

    return response()->json(['message' => 'Data saved successfully!'], 200);
}



        public function getRFQData(Request $request)
    {
        // Find the RFQ by PR ID
        $rfq = RFQ::where('pr_id', $request->pr_id)->first();

        if ($rfq) {
            // Return the RFQ data as JSON
            return response()->json($rfq, 200);
        }

        // If no RFQ found, return an error response
        return response()->json(['message' => 'RFQ not found'], 404);
    }


}
