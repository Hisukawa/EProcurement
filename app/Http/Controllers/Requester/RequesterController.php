<?php

namespace App\Http\Controllers\Requester;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseRequestRequest;
use App\Models\Category;
use App\Models\Division;
use App\Models\PurchaseRequest;
use App\Models\SupplyCategory;
use App\Models\Unit;
use App\Models\User;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Products;
use App\Models\PurchaseRequestDetail;
use App\Notifications\PurchaseRequestSubmitted;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RequesterController extends Controller
{
    public function dashboard(){
        $user = Auth::user();
        $totalPr = PurchaseRequest::where('focal_person_user', $user->id)->count();
        $approved = PurchaseRequest::where('focal_person_user', $user->id)->where("status", "approved")->count();
        $pending = PurchaseRequest::where('focal_person_user', $user->id)->where("status", "pending")->count();
        $rejected = PurchaseRequest::where('focal_person_user', $user->id)->where("status", "rejected")->count();

        $trendData = PurchaseRequest::selectRaw('MONTH(created_at) as month, COUNT(*) as requests')
            ->where('focal_person_user', $user->id)
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function($item){
                return [
                    "month" => Carbon::create()->month($item->month)->format('M'),
                    "requests" => $item->requests
                ];
            });

        $recentRequests = PurchaseRequest::with('details')
            ->where('focal_person_user', $user->id)
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
        
        return Inertia::render('Requester/Dashboard', [
            'auth' => [
                'user' => Auth::user(),
            ],
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
            'trendData' => $trendData,
            'statusData' => [
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
                ]
                
            ],
            'recentRequests' => $recentRequests

        ]);

    }





    
    // RequesterController.php





public function manage_requests(Request $request)
{
    $userId = Auth::id();
    $search = $request->input('search');

    $query = PurchaseRequest::with('details.product.unit')
    ->where('focal_person_user', $userId)
    ->when($search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
            $q->where('pr_number', 'like', "%$search%")
              ->orWhere('purpose', 'like', "%$search%");
        });
    })
    ->select('id', 'pr_number', 'purpose', 'status', 'is_sent', 'approval_image', 'created_at')
    ->orderBy('created_at', 'desc'); // 👈 newest first

if ($request->month) {
    $query->whereMonth('created_at', $request->month);
}

$purchaseRequests = $query->paginate(10)->withQueryString();


    $units = Unit::select('id', 'unit')->get();

    $products = Products::with('unit')
        ->select('id', 'name', 'specs', 'unit_id', 'default_price')
        ->get();

    return Inertia::render('Requester/ManageRequests', [
    'purchaseRequests' => $purchaseRequests->through(function ($pr) {
        return [
            'id' => $pr->id,
            'pr_number' => $pr->pr_number,
            'purpose' => $pr->purpose,
            'status' => $pr->status,
            'is_sent' => $pr->is_sent,
            'approval_image' => $pr->approval_image,
            'created_at' => $pr->created_at,
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
        ];
    }),
    'units' => $units,
    'products' => $products,
    'search' => $search,
    'month' => $request->month,
    'highlightPrId' => session('highlightPrId'),
    'flash' => [
        'success' => session('success'),
    ],
]);

}
    public function print($id)
    {
        $purchaseRequest = PurchaseRequest::with(['details.product.unit', 'focal_person'])->findOrFail($id);
        $pr = [
            'id' => $purchaseRequest->id,
            'pr_number' => $purchaseRequest->pr_number,
            'purpose' => $purchaseRequest->purpose,
            'created_at' => $purchaseRequest->created_at,
            'details' => $purchaseRequest->details->map(function ($detail) {
                return [
                    'item' => $detail->product->name ?? '',
                    'specs' => $detail->product->specs ?? '',
                    'unit' => $detail->product->unit->unit ?? '',
                    'quantity' => $detail->quantity,
                    'unit_price' => $detail->unit_price,
                ];
            }),
        ];

        $pdf = Pdf::loadView('pdf.purchase_request', [
            'pr' => $pr,
            'focal_person' => $purchaseRequest->focal_person,
        ]);

        return $pdf->stream("PR-{$purchaseRequest->pr_number}.pdf");
    }

    public function sendForReview(Request $request, $id)
    {
        $request->validate([
            'approval_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $purchaseRequest = PurchaseRequest::findOrFail($id);

        if ($request->hasFile('approval_image')) {
            $image = $request->file('approval_image');
            $filename = time() . '_' . $image->getClientOriginalName();
            $path = $image->storeAs('approval_images', $filename, 'public');
            $purchaseRequest->approval_image = $path;
        }

        $purchaseRequest->is_sent = true;
        $purchaseRequest->save();
        $reviewers = User::role('twg_user')->get(); 
        foreach ($reviewers as $reviewer) {
            $reviewer->notify(new PurchaseRequestSubmitted($purchaseRequest));
        }

        return back()->with('success', 'Purchase request and notification sent to the reviewing body.');
    }

    






}
