<?php

namespace App\Http\Controllers\Approver;

use App\Http\Controllers\Controller;
use App\Models\BacCommittee;
use App\Models\PurchaseRequest;
use App\Models\RFQ;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PrintController extends Controller
{
    public function print_rfq($prId)
{
    $pr = PurchaseRequest::with(['details.product.unit'])->findOrFail($prId);
    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    $details = $pr->details->map(function ($detail) {
        return [
            'id' => $detail->id,
            'item' => $detail->item ?? '',
            'specs' => $detail->specs ?? '',
            'unit' => $detail->unit ?? '',
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
                'item' => $detail->item ?? '',
                'specs' => $detail->specs ?? '',
                'unit' => $detail->unit ?? '',
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
                'item' => $detail->item ?? '',
                'specs' => $detail->specs ?? '',
                'unit' => $detail->unit ?? '',
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
public function printAOQ($id)
{
    $rfq = RFQ::with([
        'purchaseRequest.details',
        'details.supplier'
    ])->findOrFail($id);

    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    // ----------------------
    // ALWAYS USE FULL AOQ MODE
    // (Disregard award_mode and is_winner_as_read)
    // ----------------------

    $prItemCount = $rfq->purchaseRequest->details->count();

    $supplierTotals = $rfq->details
        ->groupBy('supplier_id')
        ->filter(function ($quotes) use ($prItemCount) {
            // Only include suppliers who quoted ALL items
            return $quotes->pluck('pr_details_id')->unique()->count() === $prItemCount;
        })
        ->map(function ($quotes) use ($rfq) {
            $total = $quotes->sum(function ($q) use ($rfq) {
                $prDetail = $rfq->purchaseRequest->details->firstWhere('id', $q->pr_details_id);
                $qty = $prDetail->quantity ?? 0;
                return ($q->quoted_price ?? 0) * $qty;
            });

            return [
                'supplier'     => $quotes->first()->supplier,
                'total_amount' => $total,
                'remarks_as_read' => $quotes->pluck('remarks_as_read')->filter()->unique()->implode(', '),
            ];
        })
        ->sortBy('total_amount')
        ->values();

    $pdf = Pdf::loadView('pdf.aoq_full', [
        'rfq'       => $rfq,
        'suppliers' => $supplierTotals,
        'committee' => $committee,
    ]);

    return $pdf->stream("AOQ_full_{$id}.pdf");
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

        // Use unit_price_edited if available, otherwise quoted_price
        $quotes = $rfq->details
            ->where('pr_details_id', $pr_detail_id)
            ->map(function ($q) use ($prDetail) {
                $q->used_price = $q->unit_price_edited ?? $q->quoted_price ?? 0;
                $q->used_quantity = $prDetail->quantity ?? 0;
                $q->subtotal = $q->used_price * $q->used_quantity;
                return $q;
            })
            ->sortBy('used_price')
            ->values();

        // Place winner on top if exists
        $winner = $quotes->firstWhere('is_winner_as_calculated', 1);
        if ($winner) {
            $quotes = collect([$winner])
                ->merge($quotes->where('id', '!=', $winner->id))
                ->values();
        }

        $pdf = Pdf::loadView('pdf.aoq_item', [
            'rfq'       => $rfq,
            'prDetail'  => $prDetail,
            'quotes'    => $quotes,
            'committee' => $committee,
            'winner'    => $winner
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
            ->map(function ($quotes) use ($rfq) {
                $total = $quotes->sum(function ($q) use ($rfq) {
                    $prDetail = $rfq->purchaseRequest->details->firstWhere('id', $q->pr_details_id);
                    $qty = $prDetail->quantity ?? 0;
                    return ($q->unit_price_edited ?? $q->quoted_price ?? 0) * $qty;
                });

                return [
                    'supplier'     => $quotes->first()->supplier,
                    'total_amount' => $total,
                    'is_winner'    => $quotes->contains('is_winner_as_calculated', 1),
                    'remarks_as_calculated'      => $quotes->pluck('remarks_as_calculated')->filter()->unique()->implode(', '),
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

    abort(400, 'Invalid AOQ mode.');
}
}
