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

    public function generatePrNumber()
    {
        $year = date('y'); // e.g., 25
        $month = date('m'); // e.g., 08
        $prefix = "$year-$month-";

        // Fetch the last PR for the current year regardless of month
        $lastPr = DB::table('tbl_purchase_requests')
            ->where('pr_number', 'like', "$year-%") 
            ->orderBy('pr_number', 'desc')
            ->first();

        if ($lastPr) {
            // Get the last 3-digit serial regardless of month
            $lastSerial = intval(substr($lastPr->pr_number, -3));
            $newSerial = str_pad($lastSerial + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newSerial = '001';
        }

        return $prefix . $newSerial;
    }



    public function create()
    {
        $user = User::with('division')->find(Auth::id());
        $division = Division::with('requestedBy')->find($user->division->id);
        $requestedBy = $division?->requestedBy ?? null;
        $prNumber = $this->generatePrNumber();
        $units = Unit::all();
        $categories = Category::all();
        $supplyCategory = SupplyCategory::all();
        $products = Products::with('unit')
                    ->select('id', 'name', 'specs', 'unit_id', 'default_price')
                    ->get();
        $latestPr = PurchaseRequest::latest()->value('pr_number'); 
        $units = Unit::all();
        $categories = Category::all();

        return Inertia::render('Requester/Create', [
            'units' => $units,
            'categories' => $categories,
            'supplyCategories' => $supplyCategory,
            'requestedBy' => $requestedBy,
            'auth' => ['user' => $user],
            'pr_number' => $prNumber,
            'products' => $products,
            'latestPr' => $latestPr,
        ]);
    }
    public function create_product()
    {
        return Inertia::render('Requester/CreateProduct', [
            'units' => Unit::all(),         // tbl_units
            'categories' => Category::all() // tbl_categories
        ]);
    }
    
public function store_product(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'specs' => 'nullable|string',
        'unit_id' => 'required|exists:tbl_units,id',
        'category_id' => 'required|exists:tbl_categories,id',
        'supply_category_id' => 'required|exists:tbl_supply_categories,id',
        'default_price' => 'nullable|numeric|min:0',
    ]);

    $product = Products::create($validated)->load('unit');

    return response()->json([
        'success' => true,
        'message' => 'Product created successfully!',
        'product' => $product,
    ]);
}


public function store(Request $request)
{
    $request->validate([
        'focal_person' => 'required|exists:users,id',
        'pr_number' => 'required|string|max:50|unique:tbl_purchase_requests,pr_number',
        'purpose' => 'nullable|string|max:1000',
        'division_id' => 'required|exists:tbl_divisions,id',
        'requested_by' => 'required|string|max:255',

        'products.*.product_id' => 'required|exists:tbl_products,id',
        'products.*.item' => 'required|string|max:255',
        'products.*.specs' => 'required|string|max:1000',
        'products.*.unit' => 'required|string|max:50',
        'products.*.unit_price' => 'nullable|numeric|min:0',
        'products.*.total_item_price' => 'nullable|numeric|min:0',
        'products.*.quantity' => 'required|numeric|min:0.01',
    ]);

    DB::transaction(function () use ($request) {
        $purchaseRequest = PurchaseRequest::create([
            'focal_person_user' => $request['focal_person'],
            'pr_number' => $request['pr_number'],
            'purpose' => $request['purpose'],
            'division_id' => $request['division_id'],
            'requested_by' => $request['requested_by'],
        ]);

        $totalPRPrice = 0;

        foreach ($request['products'] as $item) {
            $totalItemPrice = $item['quantity'] * $item['unit_price'];
            $totalPRPrice += $totalItemPrice;

            PurchaseRequestDetail::create([
                'pr_id' => $purchaseRequest->id,
                'product_id' => $item['product_id'],
                'item' => $item['item'],
                'specs' => $item['specs'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_item_price' => $totalItemPrice,
            ]);
        }

        $purchaseRequest->update(['total_price' => $totalPRPrice]);
    });

    return response()->json([
        'success' => true,
        'message' => 'Purchase Request successfully submitted!',
    ]);

}

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
    public function store_details(Request $request, $pr_id)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:tbl_products,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0.01',
        ]);

        $product = Products::with('unit')->findOrFail($validated['product_id']);

        $purchaseRequest = PurchaseRequest::findOrFail($pr_id);

        $unitPrice = $validated['unit_price'];
        $totalPrice = $validated['quantity'] * $unitPrice;

        $purchaseRequest->details()->create([
            'pr_id' => $purchaseRequest->id,
            'product_id' => $product->id,
            'item' => $product->name,
            'specs' => $product->specs,
            'unit' => $product->unit?->unit ?? 'pcs',
            'quantity' => $validated['quantity'],
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
        ]);

        return redirect()->back()->with('success', 'Item added successfully to Purchase Request.');
    }


    public function add_details($pr_id)
    {
        $purchaseRequest = PurchaseRequest::with('details')->select('id', 'pr_number')->findOrFail($pr_id);
        
        // Load details along with their related products and units for easier access
        $purchaseRequest->load(['details.product.unit']);

        $units = Unit::select('id', 'unit')->get();

        $products = Products::with('unit')
                    ->select('id', 'name', 'specs', 'unit_id', 'default_price')
                    ->get();

        return Inertia::render('Requester/AddDetails', [
            'prId' => $purchaseRequest->id,
            'units' => $units,
            'pr_number' => $purchaseRequest->pr_number,
            'products' => $products,
            'prDetails' => $purchaseRequest->details->map(function($detail) {
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
        ]);
    }


    public function print($id)
    {
$purchaseRequest = PurchaseRequest::with(['details.product.unit'])->findOrFail($id);

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

    // 👇 Load Blade instead of React for Snappy
    $pdf = Pdf::loadView('pdf.purchase_request', [
        'pr' => $pr,
        'focal_person' => $purchaseRequest->focal_person,
    ]);

    return $pdf->stream("PR-{$purchaseRequest->pr_number}.pdf");
    }

    public function sendForApproval(Request $request, $id)
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
        $approvers = User::role('bac_approver')->get(); 
        foreach ($approvers as $approver) {
            $approver->notify(new PurchaseRequestSubmitted($purchaseRequest));
        }

        return back()->with('success', 'Purchase request and notification sent to the approving body.');
    }

    public function update_details(Request $request, $detailId)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:1',
        ]);

        $detail = PurchaseRequestDetail::where('id', $detailId);

        $detail->update([
            'quantity' => $request->quantity,
        ]);

        return redirect()->back()->with('success', 'Item updated successfully.');
    }

    public function delete_details($detailId)
    {
        $detail = PurchaseRequestDetail::where('id', $detailId);
        $detail->delete();

        return redirect()->back()->with('success', 'Item deleted successfully.');
    }
    public function updatePrice(Request $request, Products $product)
    {
        $validated = $request->validate([
            'default_price' => 'required|numeric|min:0',
        ]);

        $product->update($validated);

        return back()->with('success', 'Product price updated!');
    }






}
