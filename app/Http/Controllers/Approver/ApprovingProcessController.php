<?php

namespace App\Http\Controllers\Approver;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\RFQ;
use App\Models\RFQDetail;
use App\Models\Supplier;
use App\Models\User;
use App\Notifications\PurchaseRequestApproved;
use App\Notifications\PurchaseRequestSentBack;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApprovingProcessController extends Controller
{
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





    public function approved_requests(Request $request)
    {
        $query = PurchaseRequest::with(['details', 'division', 'focal_person', 'rfqs'])
            ->where('status', 'Reviewed');

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

        


    
}
