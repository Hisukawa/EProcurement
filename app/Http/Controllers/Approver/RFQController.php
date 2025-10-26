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


}
