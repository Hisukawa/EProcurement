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
        $approved = PurchaseRequest::where("status", "reviewed")->count();
        $pending = PurchaseRequest::where("status", "pending")->count();
        $rejected = PurchaseRequest::where("status", "rejected")->count();

        $deptData = PurchaseRequest::with('division')
            ->get()
            ->groupBy(fn($pr) => $pr->division->division)
            ->map(function ($prs, $divisionName) {
                return [
                    'division' => $divisionName,
                    'approved' => $prs->filter(fn($pr) => strtolower($pr->status) === 'reviewed')->count(),
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

public function submit_project_info(Request $request, $id)
{
    $validated = $request->validate([
        'project_no'      => 'nullable|string|max:1000',
        'date_of_opening' => 'nullable|date',
        'venue'           => 'nullable|string|max:255',
    ]);

    $rfq = RFQ::findOrFail($id);
    $rfq->update($validated); // <- update RFQ, not details

    return back()->with('success', 'Project information updated successfully!');
}





}