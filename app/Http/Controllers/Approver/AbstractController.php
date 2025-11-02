<?php

namespace App\Http\Controllers\Approver;

use App\Http\Controllers\Controller;
use App\Models\AuditLogs;
use App\Models\BacCommittee;
use App\Models\RFQ;
use App\Models\RFQDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AbstractController extends Controller
{
        public function abstract_of_quotations($pr)
    {
        $rfq = RFQ::with([
            'purchaseRequest.focal_person',
            'purchaseRequest.division',
            'purchaseRequest.details',
            'purchaseOrder'
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
            'purchaseOrder'
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
        // detail_id may be either an RFQ detail ID or a PR detail ID; validate as integer only
        'detail_id'   => 'nullable|integer',
        'remarks_as_read'     => 'nullable|string',
    ]);

    $supplierId = $request->input('supplier_id');
    $remarks    = $request->input('remarks_as_read');
    $prDetailId = $request->input('detail_id');

    $rfq = RFQ::findOrFail($id);
    $rfq->mode = 'as-read'; // set as-read mode

    try {
        if ($prDetailId) {
            // --- PER-ITEM WINNER ---
            // Accept either an RFQDetail id (tbl_rfq_details.id) or a PR detail id (tbl_pr_details.id)
            $resolvedPrDetailId = $prDetailId;
            $maybeRfqDetail = RFQDetail::where('id', $prDetailId)->where('rfq_id', $id)->first();
            if ($maybeRfqDetail) {
                // caller passed an RFQDetail id; use its pr_details_id
                $resolvedPrDetailId = $maybeRfqDetail->pr_details_id;
            }

            RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $resolvedPrDetailId)
                ->update(['is_winner_as_read' => false]);

            $quote = RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $resolvedPrDetailId)
                ->where('supplier_id', $supplierId)
                ->firstOrFail();

            $quote->is_winner_as_read = true;
            $quote->remarks_as_read   = $remarks;
            // leave quoted_price untouched
            $quote->save();

            $rfq->award_mode = 'per-item';
        } else {
            // --- WHOLE-PR WINNER ---
            RFQDetail::where('rfq_id', $id)->update([
                'is_winner_as_read' => false,
                'remarks_as_read'   => null,
            ]);

            RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->update([
                    'is_winner_as_read' => true,
                    'remarks_as_read'   => $remarks,
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
        // detail_id may be either an RFQ detail ID or a PR detail ID; validate as integer only
        'detail_id'    => 'nullable|integer',
        'remarks_as_calculated' => 'nullable|string',
        'custom_price' => 'nullable|numeric|min:0', // per-item
    ]);

    $supplierId  = $request->input('supplier_id');
    $remarks     = $request->input('remarks_as_calculated');
    $prDetailId  = $request->input('detail_id');
    $customPrice = $request->input('custom_price');

    $rfq = RFQ::findOrFail($id);
    $rfq->mode = 'as-calculated';

    try {
        if ($prDetailId) {
            // --- PER-ITEM WINNER ---
            // Accept either an RFQDetail id or a PR detail id
            $resolvedPrDetailId = $prDetailId;
            $maybeRfqDetail = RFQDetail::where('pr_details_id', $prDetailId)
                ->where('rfq_id', $id)
                ->first();

            if ($maybeRfqDetail) {
                $resolvedPrDetailId = $maybeRfqDetail->pr_details_id;
            }

            // Reset previous winner for this specific item
            RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $resolvedPrDetailId)
                ->update(['is_winner_as_calculated' => false]);

            // Set new winner for this item
            $quote = RFQDetail::where('rfq_id', $id)
                ->where('pr_details_id', $resolvedPrDetailId)
                ->where('supplier_id', $supplierId)
                ->firstOrFail();

            $quote->is_winner_as_calculated = true;
            $quote->remarks_as_calculated   = $remarks;
            // Only overwrite unit_price_edited when a custom price was explicitly provided.
            // This prevents accidental clearing of an existing edited price when the
            // request doesn't include custom_price.
            if ($customPrice !== null) {
                $quote->unit_price_edited = $customPrice; // store custom per-item price
            }
            $quote->save();

            // Recalculate total per supplier for per-item winners (price * quantity)
            $total = RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->where('is_winner_as_calculated', true)
                ->get()
                ->sum(function ($detail) {
                    $price = $detail->unit_price_edited ?? $detail->quoted_price ?? 0;
                    $qty = $detail->prDetail->quantity ?? 1;
                    return $price * $qty;
                });

            $rfq->total_price_calculated = $total;
            $rfq->award_mode = 'per-item';

        } else {
            // --- WHOLE-PR WINNER ---
            RFQDetail::where('rfq_id', $id)->update([
                'is_winner_as_calculated' => false,
                'remarks_as_calculated'   => null,
            ]);

            RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->update([
                    'is_winner_as_calculated' => true,
                    'remarks_as_calculated'   => $remarks,
                ]);

            // Recalculate total_price_calculated for the winning supplier
            $total = RFQDetail::where('rfq_id', $id)
                ->where('supplier_id', $supplierId)
                ->get()
                ->sum(function ($detail) {
                    $price = $detail->unit_price_edited ?? $detail->quoted_price ?? 0;
                    $qty = $detail->prDetail->quantity ?? 1;
                    return $price * $qty;
                });

            $rfq->total_price_calculated = $total;
            $rfq->award_mode = 'whole-pr';
        }

        $rfq->save();

        return response()->json([
            'success' => true,
            'message' => 'Winner updated successfully (as-calculated).',
            'total_price_calculated' => $rfq->total_price_calculated,
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
        'detail_id'   => 'required|integer|exists:tbl_pr_details,id',
        'unit_price'  => 'required|numeric|min:0',
    ]);

    $supplierId = $request->input('supplier_id');
    $detailId   = $request->input('detail_id');
    $unitPrice  = $request->input('unit_price');

    try {
        // Update the specific RFQ detail's unit_price_edited
        $rfqDetail = RFQDetail::where('pr_details_id', $detailId)
            ->where('supplier_id', $supplierId)
            ->where('rfq_id', $rfq)
            ->first();
        
        if (!$rfqDetail) {
            return response()->json([
                'success' => false,
                'message' => "RFQ Detail not found for supplier ID $supplierId and detail ID $detailId",
            ], 404);
        }

        $rfqDetail->unit_price_edited = $unitPrice;
        $rfqDetail->save();

        // Recalculate total_price_calculated for the RFQ (unit price × quantity)
        $rfqModel = RFQ::findOrFail($rfq);
        $total = $rfqModel->details
            ->where('supplier_id', $supplierId) // only this supplier
            ->sum(function ($detail) {
                $price = $detail->unit_price_edited ?? $detail->quoted_price ?? 0;
                $qty   = $detail->prDetail->quantity ?? 1; // default to 1 if quantity is null
                return $price * $qty;
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


public function saveRemarksAsRead(Request $request, $id, $prDetailId = null)
{
    
    $request->validate([
        'supplier_id' => 'required|integer',
        'remarks_as_read' => 'nullable|string|max:1000',
    ]);
    $supplierId = $request->input('supplier_id');
    $remarks = $request->input('remarks_as_read');


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
            $quote->remarks_as_read = $remarks;
            $quote->save();
        } else {
            return back()->with('error', 'Could not find the specified quote.');
        }
    } else {
        // 🔹 Update remarks for all items from this supplier in the RFQ
        RFQDetail::where('rfq_id', $id)
            ->where('supplier_id', $supplierId)
            ->update(['remarks_as_read' => $remarks]);
    }

    return back()->with('success', 'Remarks have been successfully saved.');
}
public function saveRemarksAsCalculated(Request $request, $id, $prDetailId = null)
{
    
    $request->validate([
        'supplier_id' => 'required|integer',
        'remarks_as_calculated' => 'nullable|string|max:1000',
    ]);
    $supplierId = $request->input('supplier_id');
    $remarks = $request->input('remarks_as_calculated');


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
            $quote->remarks_as_calculated = $remarks;
            $quote->save();
        } else {
            return back()->with('error', 'Could not find the specified quote.');
        }
    } else {
        // 🔹 Update remarks for all items from this supplier in the RFQ
        RFQDetail::where('rfq_id', $id)
            ->where('supplier_id', $supplierId)
            ->update(['remarks_as_calculated' => $remarks]);
    }

    return back()->with('success', 'Remarks have been successfully saved.');
}
public function rollbackWinnerAsRead(Request $request, $id)
{
    $user = Auth::user();
    $request->validate([
        'remarks_as_read' => 'required|string',
        'mode'    => 'required|in:whole-pr,per-item',
        'detail_id' => 'nullable|integer'
    ]);

    $rfq = RFQ::with('details')->findOrFail($id);

    $changes = [];
    if ($request->mode === 'whole-pr') {
        $changes = $rfq->details()
            ->where('is_winner_as_read', true)
            ->get(['id', 'pr_details_id', 'supplier_id']);
        
        $rfq->details()->update(['is_winner_as_read' => false]);
        $rfq->award_mode = null; // reset award mode
        $rfq->save();

    } elseif ($request->mode === 'per-item' && $request->detail_id) {
        $changes = $rfq->details()
            ->where('pr_details_id', $request->detail_id)
            ->where('is_winner_as_read', true)
            ->get(['id', 'pr_details_id', 'supplier_id']);

        $rfq->details()
            ->where('pr_details_id', $request->detail_id)
            ->update(['is_winner_as_read' => false]);

        // Check if any winners left for this RFQ
        $hasAnyWinnerLeft = $rfq->details()->where('is_winner_as_read', true)->exists();
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
        'reason'       => $request->remarks_as_read,
        'user_id'      => $user->id,
    ]);

    return back()->with('success', 'Winner rollback successful.');
}

public function rollbackWinnerAsCalculated(Request $request, $id)
{
    $user = Auth::user();
    $request->validate([
        'remarks_as_calculated' => 'required|string',
        'mode'    => 'required|in:whole-pr,per-item',
        'detail_id' => 'nullable|integer'
    ]);

    $rfq = RFQ::with('details')->findOrFail($id);

    $changes = [];
    if ($request->mode === 'whole-pr') {
        $changes = $rfq->details()
            ->where('is_winner_as_calculated', true)
            ->get(['id', 'pr_details_id', 'supplier_id']);
        
        $rfq->details()->update(['is_winner_as_calculated' => false]);
        $rfq->award_mode = null; // reset award mode
        $rfq->save();

    } elseif ($request->mode === 'per-item' && $request->detail_id) {
        $changes = $rfq->details()
            ->where('pr_details_id', $request->detail_id)
            ->where('is_winner_as_calculated', true)
            ->get(['id', 'pr_details_id', 'supplier_id']);

        $rfq->details()
            ->where('pr_details_id', $request->detail_id)
            ->update(['is_winner_as_calculated' => false]);

        // Check if any winners left for this RFQ
        $hasAnyWinnerLeft = $rfq->details()->where('is_winner_as_calculated', true)->exists();
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
        'reason'       => $request->remarks_as_calculated,
        'user_id'      => $user->id,
    ]);

    return back()->with('success', 'Winner rollback successful.');
}
}
