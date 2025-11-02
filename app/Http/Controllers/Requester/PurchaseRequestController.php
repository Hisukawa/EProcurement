<?php

namespace App\Http\Controllers\Requester;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Products;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestDetail;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
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

    // Generate the Purchase Request (PR) Number
    $prNumber = $this->generatePrNumber();

    // Fetch all units
    $units = Unit::all();

    // Fetch the products with unit information
    $products = Products::with('unit')
        ->select('id', 'name', 'specs', 'unit_id', 'default_price')
        ->get();

    // Get the latest PR number
    $latestPr = PurchaseRequest::latest()->value('pr_number');

    // Pass the necessary data to the frontend
    return Inertia::render('Requester/Create', [
        'units' => $units, // The list of all units
        'requestedBy' => $requestedBy,
        'auth' => ['user' => $user],
        'pr_number' => $prNumber,
        'products' => $products,
        'latestPr' => $latestPr,
    ]);
}

    public function storeUnit(Request $request)
{
    $validated = $request->validate([
        'unit' => 'required|string|max:255|unique:tbl_units,unit',
    ]);

    $unit = Unit::create([
        'unit' => $validated['unit'],
    ]);

    return response()->json($unit);
}

public function store_product(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'specs' => 'nullable|string',
        'unit_id' => 'nullable|exists:tbl_units,id',
        'custom_unit' => 'nullable|string|max:255',
        'default_price' => 'nullable|numeric|min:0',
    ]);

    // ✅ Check if a custom unit is provided
    if (!empty($request->custom_unit)) {
        // Check if the custom unit already exists
        $existingUnit = Unit::where('unit', $request->custom_unit)->first();

        if ($existingUnit) {
            // If unit exists, use the existing unit id
            $validated['unit_id'] = $existingUnit->id;
        } else {
            // If the unit does not exist, create a new unit
            $newUnit = Unit::create([
                'unit' => $request->custom_unit,
            ]);
            $validated['unit_id'] = $newUnit->id; // Replace with new unit id
        }
    }

    // Ensure that either unit_id or custom_unit is provided
    if (empty($validated['unit_id'])) {
        return response()->json([
            'success' => false,
            'message' => 'Please select or provide a unit.',
        ], 422);
    }

    // Create the product with the validated data
    $product = Products::create([
        'name' => $validated['name'],
        'specs' => $validated['specs'] ?? null,
        'unit_id' => $validated['unit_id'],
        'default_price' => $validated['default_price'] ?? 0,
    ])->load('unit');

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

public function store_details(Request $request, $pr_id)
{
    // Validate the incoming data
    $validated = $request->validate([
        'product_id' => 'required|exists:tbl_products,id',
        'quantity' => 'required|numeric|min:0.01',
        'unit_price' => 'required|numeric|min:0.01',
        'unit_id' => 'nullable|exists:tbl_units,id', // Check if unit_id exists
        'custom_unit' => 'nullable|string|max:255', // Check if custom unit is valid
    ]);

    // Fetch the product and purchase request
    $product = Products::with('unit')->findOrFail($validated['product_id']);
    $purchaseRequest = PurchaseRequest::findOrFail($pr_id);

    // Determine the unit (either from unit_id or custom_unit)
    if (!empty($request->custom_unit)) {
        // Handle the custom unit logic
        $customUnit = $request->custom_unit;
        $existingUnit = Unit::where('unit', $customUnit)->first();

        if ($existingUnit) {
            // If the unit exists, use the existing unit's name
            $unit = $existingUnit->unit;
        } else {
            // If the unit doesn't exist, create a new unit
            $newUnit = Unit::create(['unit' => $customUnit]);
            $unit = $newUnit->unit; // Use the newly created unit's name
        }
    } elseif ($request->unit_id) {
        // If unit_id is provided (dropdown unit selected), use that
        $unit = Unit::find($request->unit_id)->unit;
    } else {
        // If no unit or custom unit is provided, return an error
        return redirect()->back()->with('error', 'Please select or provide a unit.');
    }

    // Check if the product is already in the details of the PR
    $existingDetail = PurchaseRequestDetail::where('pr_id', $purchaseRequest->id)
        ->where('product_id', $product->id)
        ->first();

    if ($existingDetail) {
        // If the item exists, update the quantity and total price
        $existingDetail->quantity += $validated['quantity']; // Add new quantity to existing one
        $existingDetail->total_item_price = $existingDetail->quantity * $existingDetail->unit_price; // Recalculate total price
        $existingDetail->save();

        return redirect()->back()->with('success', 'Item quantity updated successfully.');
    } else {
        // If the item doesn't exist, create a new detail
        $unitPrice = $validated['unit_price'];
        $totalPrice = $validated['quantity'] * $unitPrice;

        $purchaseRequest->details()->create([
            'pr_id' => $purchaseRequest->id,
            'product_id' => $product->id,
            'item' => $product->name,
            'specs' => $product->specs,
            'unit' => $unit, // Use the determined unit (either from dropdown or custom)
            'quantity' => $validated['quantity'],
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
        ]);

        return redirect()->back()->with('success', 'Item added successfully to Purchase Request.');
    }
}




    public function add_details($pr_id)
    {
        $purchaseRequest = PurchaseRequest::with('details')->select('id', 'pr_number', 'purpose', 'send_back_reason', 'rejection_reason')->findOrFail($pr_id);
        
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
            'purpose' => $purchaseRequest->purpose,
            'sendBackReason' => $purchaseRequest->send_back_reason,
            'rejectionReason' => $purchaseRequest->rejection_reason,
            'prDetails' => $purchaseRequest->details->map(function($detail) {
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
        ]);
    }
public function update_details(Request $request, $detailId)
{
    // Validate input
    $validated = $request->validate([
        'item' => 'required|string|max:255',
        'specs' => 'required|string|max:1000',
        'quantity' => 'required|numeric|min:1',
        'unit_id' => 'nullable|exists:tbl_units,id',
        'custom_unit' => 'nullable|string|max:255',
    ]);

    // Find the PR detail
    $detail = PurchaseRequestDetail::findOrFail($detailId);

    $unitModel = null;
    $unitName = $detail->unit; // default to existing unit (in case none provided)

    // Handle unit updates only if changed
    if (!empty($request->custom_unit)) {
        $unitModel = Unit::firstOrCreate(['unit' => $request->custom_unit]);
        $unitName = $unitModel->unit;
    } elseif ($request->unit_id) {
        $unitModel = Unit::find($request->unit_id);
        $unitName = $unitModel->unit;
    }

    // Update PR detail
    $detail->update([
        'item'     => $validated['item'],
        'specs'    => $validated['specs'],
        'quantity' => $validated['quantity'],
        'unit'     => $unitName,
    ]);

    // Update linked product if exists
    if ($detail->product_id) {
        $product = Products::find($detail->product_id);
        if ($product) {
            $product->update([
                'name'    => $validated['item'],
                'specs'   => $validated['specs'],
                // update unit_id only if changed
                'unit_id' => $unitModel ? $unitModel->id : $product->unit_id,
            ]);
        }
    }

    return redirect()->back()->with('success', 'Item updated successfully.');
}





public function updatePurpose(Request $request, $pr)
{
    // Validate the incoming data for purpose
    $validated = $request->validate([
        'purpose' => 'nullable|string|max:1000',  // Ensure purpose is a string with a max length
    ]);

    // Find the purchase request by ID
    $purchaseRequest = PurchaseRequest::findOrFail($pr);

    // Update the purpose field in the purchase request
    $purchaseRequest->update([
        'purpose' => $validated['purpose'],  // Update the purpose field
    ]);

    // After updating, redirect back with success message
    return back()->with('success', 'Purpose updated successfully.');
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
