<?php

namespace App\Http\Controllers\TwgUserController;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\User;
use App\Notifications\PurchaseRequestApproved;
use App\Notifications\PurchaseRequestSentBack;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth as FacadesAuth;
use Inertia\Inertia;

class TwgController extends Controller
{
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Function to render the dashboard page for twg user
 */public function dashboard(){
    $user = FacadesAuth::user();

        return Inertia::render('TwgUser/Dashboard',[
            'user' => $user,
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

        return Inertia::render('TwgUser/ForReview', [
            'sentPurchaseRequests' => $sentPRs,
            'filters' => $request->only(['prNumber', 'focalPerson', 'division']),
        ]);
    }

    public function show_details($id)
{
    $pr = PurchaseRequest::with(['details.product.unit', 'division', 'focal_person'])
        ->findOrFail($id);

    return Inertia::render('TwgUser/ViewDetails', [
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
                    'item' => $detail->item ?? '',
                    'specs' => $detail->specs ?? '',
                    'unit' => $detail->unit ?? '',
                    'quantity' => $detail->quantity,
                    'unit_price' => $detail->unit_price,
                    'total_price' => $detail->quantity * $detail->unit_price,
                ];
            }),
        ],
    ]);
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
    public function review(PurchaseRequest $pr)
    {
        try {
            $pr->update([
                'status' => 'Reviewed',
            ]);
            if ($pr->focal_person) {
            $pr->focal_person->notify(new PurchaseRequestApproved($pr));
        }
        } catch (Exception $e) {
            dd($e->getMessage());
        }

        return back()->with('success', 'PR sent back with reason.');
    }



}
