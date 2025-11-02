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

/**
 * Print AOQ for per-item winners grouped by supplier.
 * Each supplier that won one or more items will get a single page
 * containing only the lines they won.
 */
public function printAoqPerItemGrouped($id)
{
    $rfq = RFQ::with([
        'purchaseRequest.details',
        'details.supplier'
    ])->findOrFail($id);

    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    // Build groups: supplier_id => ['supplier' => Supplier, 'lines' => []]
    $groupsMap = [];

    foreach ($rfq->purchaseRequest->details as $prDetail) {
        // Find the quote for this PR detail that was marked as winner (as calculated)
        $winningQuote = $rfq->details
            ->where('pr_details_id', $prDetail->id)
            ->firstWhere('is_winner_as_calculated', 1);

        if (!$winningQuote) {
            // Skip items without a per-item winner
            continue;
        }

        $sid = $winningQuote->supplier_id;

        if (!isset($groupsMap[$sid])) {
            $groupsMap[$sid] = [
                'supplier' => $winningQuote->supplier,
                'lines' => [],
                'remarks' => [],
            ];
        }

        $unitPrice = $winningQuote->unit_price_edited ?? $winningQuote->quoted_price ?? 0;
        $quantity = $prDetail->quantity ?? 0;
        $lineTotal = $unitPrice * $quantity;

        $groupsMap[$sid]['lines'][] = [
            'pr_detail_id' => $prDetail->id,
            'item' => $prDetail->item ?? '',
            'specs' => $prDetail->specs ?? '',
            'unit' => $prDetail->unit ?? '',
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
        ];

        if (!empty($winningQuote->remarks_as_calculated)) {
            $groupsMap[$sid]['remarks'][] = trim($winningQuote->remarks_as_calculated);
        }
    }

    // Prepare final groups array for the view
    // For each winner (group), we will collect ALL suppliers who quoted on the items
    // that the winner won, compute their totals for those items, and mark the winner.
    $groups = [];
    foreach ($groupsMap as $sid => $g) {
        $prDetailIds = collect($g['lines'])->pluck('pr_detail_id')->filter()->values()->all();

        // Find all quotes for these pr detail ids
        $quotesForGroup = $rfq->details->filter(function ($q) use ($prDetailIds) {
            return in_array($q->pr_details_id, $prDetailIds);
        });

        // Group by supplier and compute totals for these lines
        $suppliersSummary = $quotesForGroup->groupBy('supplier_id')->map(function ($quotes) use ($rfq) {
            $supplier = $quotes->first()->supplier;
            $total = $quotes->sum(function ($q) use ($rfq) {
                $prDetail = $rfq->purchaseRequest->details->firstWhere('id', $q->pr_details_id);
                $qty = $prDetail->quantity ?? 0;
                $unitPrice = $q->unit_price_edited ?? $q->quoted_price ?? 0;
                return $unitPrice * $qty;
            });

            $remarks = $quotes->pluck('remarks_as_calculated')->filter()->unique()->implode(', ');

            return [
                'supplier' => $supplier,
                'total_amount' => $total,
                'remarks_as_calculated' => $remarks,
                'is_winner' => $quotes->contains('is_winner_as_calculated', 1),
            ];
        })->values()->all();

        // Build group entry
        $groups[] = [
            'winner_supplier_id' => $sid,
            'suppliers' => $suppliersSummary,
            // keep lines for potential future use (not printed by current layout)
            'lines' => $g['lines'],
        ];
    }

    // If no groups (no per-item winners), abort or show an empty PDF
    if (empty($groups)) {
        abort(400, 'No per-item winners to print.');
    }

    $pdf = Pdf::loadView('pdf.aoq_per_item_grouped_like_full_pr', [
        'rfq' => $rfq,
        'groups' => $groups,
        'committee' => $committee,
    ]);

    return $pdf->stream("AOQ_per_item_grouped_{$id}.pdf");
}
public function printAoqPerItemGroupedRead($id)
{
    $rfq = RFQ::with([
        'purchaseRequest.details',
        'details.supplier'
    ])->findOrFail($id);

    $committee = BacCommittee::with('members')
        ->where('committee_status', 'active')
        ->first();

    // Build groups: supplier_id => ['supplier' => Supplier, 'lines' => []]
    $groupsMap = [];

    foreach ($rfq->purchaseRequest->details as $prDetail) {
        // Find the quote for this PR detail that was marked as winner (as calculated)
        $winningQuote = $rfq->details
            ->where('pr_details_id', $prDetail->id)
            ->firstWhere('is_winner_as_calculated', 1);

        if (!$winningQuote) {
            // Skip items without a per-item winner
            continue;
        }

        $sid = $winningQuote->supplier_id;

        if (!isset($groupsMap[$sid])) {
            $groupsMap[$sid] = [
                'supplier' => $winningQuote->supplier,
                'lines' => [],
                'remarks' => [],
            ];
        }

        $unitPrice = $winningQuote->unit_price_edited ?? $winningQuote->quoted_price ?? 0;
        $quantity = $prDetail->quantity ?? 0;
        $lineTotal = $unitPrice * $quantity;

        $groupsMap[$sid]['lines'][] = [
            'pr_detail_id' => $prDetail->id,
            'item' => $prDetail->item ?? '',
            'specs' => $prDetail->specs ?? '',
            'unit' => $prDetail->unit ?? '',
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
        ];

        if (!empty($winningQuote->remarks_as_calculated)) {
            $groupsMap[$sid]['remarks'][] = trim($winningQuote->remarks_as_calculated);
        }
    }

    // Prepare final groups array for the view
    // For each winner (group), we will collect ALL suppliers who quoted on the items
    // that the winner won, compute their totals for those items, and mark the winner.
    $groups = [];
    foreach ($groupsMap as $sid => $g) {
        $prDetailIds = collect($g['lines'])->pluck('pr_detail_id')->filter()->values()->all();

        // Find all quotes for these pr detail ids
        $quotesForGroup = $rfq->details->filter(function ($q) use ($prDetailIds) {
            return in_array($q->pr_details_id, $prDetailIds);
        });

        // Group by supplier and compute totals for these lines
        $suppliersSummary = $quotesForGroup->groupBy('supplier_id')->map(function ($quotes) use ($rfq) {
            $supplier = $quotes->first()->supplier;
            $total = $quotes->sum(function ($q) use ($rfq) {
                $prDetail = $rfq->purchaseRequest->details->firstWhere('id', $q->pr_details_id);
                $qty = $prDetail->quantity ?? 0;
                $unitPrice = $q->unit_price_edited ?? $q->quoted_price ?? 0;
                return $unitPrice * $qty;
            });

            $remarks = $quotes->pluck('remarks_as_read')->filter()->unique()->implode(', ');

            return [
                'supplier' => $supplier,
                'total_amount' => $total,
                'remarks_as_read' => $remarks,
                'is_winner' => $quotes->contains('remarks_as_read', 1),
            ];
        })->values()->all();

        // Build group entry
        $groups[] = [
            'winner_supplier_id' => $sid,
            'suppliers' => $suppliersSummary,
            // keep lines for potential future use (not printed by current layout)
            'lines' => $g['lines'],
        ];
    }

    // If no groups (no per-item winners), abort or show an empty PDF
    if (empty($groups)) {
        abort(400, 'No per-item winners to print.');
    }

    $pdf = Pdf::loadView('pdf.aoq_per_item_grouped_like_full_pr_read', [
        'rfq' => $rfq,
        'groups' => $groups,
        'committee' => $committee,
    ]);

    return $pdf->stream("AOQ_per_item_grouped_{$id}.pdf");
}
}
