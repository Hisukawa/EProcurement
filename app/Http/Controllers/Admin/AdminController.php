<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLogs;
use App\Models\BacCommittee;
use App\Models\BacCommitteeMember;
use App\Models\Division;
use App\Models\IAR;
use App\Models\ICS;
use App\Models\InspectionCommittee;
use App\Models\InspectionCommitteeMember;
use App\Models\Inventory;
use App\Models\PAR;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use App\Models\PurchaseRequest;
use App\Models\RequestedBy;
use App\Models\RFQ;
use App\Models\RIS;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    public function view_users(Request $request) {
        $search = $request->input("search");
        $filters = $request->input("division");
        $perPage = $request->input("perPage", 10);
        // Eager load division relation
        $users = User::with('division', 'roles')
        ->when($search, function($query, $search){
            $query->where(function ($q) use ($search) {
                $q->where('firstname', 'like', "%{$search}%")
                ->orWhere("lastname", "like", "%{$search}%")
                ->orWhere("middlename", "like", "%{$search}%");
            });
        })
        ->when($filters, function ($query, $filters) {
            $query->where('division_id', $filters);
        })
        ->paginate(10)
        ->appends($request->all());
        $divisions = Division::select('id', 'division')->get();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'division' => $filters,
                'divisions' => $divisions,
                'perPage' => $perPage,
            ],
            'divisions' => Division::all(), // ✅ make sure this exists
            'roles' => Role::all(),
        ]);
    }
    public function update_user(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Validate the incoming request
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'position' => 'nullable|string|max:255',
            'division_id' => 'nullable|exists:tbl_divisions,id',
            'role' => 'required|string|exists:roles,name',
            // Optional password update
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        // Update user fields
        $user->firstname = $validated['firstname'];
        $user->middlename = $validated['middlename'] ?? null;
        $user->lastname = $validated['lastname'];
        $user->email = $validated['email'];
        $user->position = $validated['position'] ?? null;
        $user->division_id = $validated['division_id'] ?? null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        // Update role (remove old roles first)
        $user->syncRoles([$validated['role']]);

        return response()->json([
        'message' => 'User updated successfully.',
        'user' => $user,
    ]);
    }
    
public function dashboard()
{
    $user = Auth::user();

    // ---- Stats ----
    $totalStock = Inventory::sum('total_stock');
    $pendingDeliveries = PurchaseOrder::where('status', 'Not yet Delivered')->count();
    $totalIcs = ICS::count();
    $totalRis = RIS::count();
    $totalIcsHigh = ICS::whereHas('items', fn($q) => $q->where('type', 'high'))->count();
    $totalIcsLow = ICS::whereHas('items', fn($q) => $q->where('type', 'low'))->count();
    $totalPar = PAR::count();
    $totalIssued = $totalIcs + $totalRis + $totalPar;
    $totalPo = PurchaseOrder::count();

    // ---- User Stats ----
    $totalUsers = User::count();
    $activeUsers = User::where('account_status', true)->count();
    $roles = Role::all();
    $usersPerRoleChart = $roles->map(fn($role) => [
        'role' => $role->name,
        'count' => $role->users()->count(),
    ]);
    $prActivities = PurchaseRequest::with('focal_person')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->map(fn($pr) => [
            'id' => $pr->pr_number,
            'action' => 'Purchase Request Created',
            'user' => $pr->focal_person?->firstname . ' ' . $pr->focal_person?->lastname,
            'date' => $pr->created_at->format('M d, Y H:i'),
        ]);

    // --- RFQ Winner Selected ---
    $rfqActivities = RFQ::with('details.supplier', 'recordedBy')
        ->latest('updated_at')
        ->take(10)
        ->get()
        ->flatMap(fn($rfq) => $rfq->details
            ->filter(fn($d) => $d->is_winner_as_calculated)
            ->map(fn($w) => [
                'id' => $rfq->id,
                'action' => "Winner Selected: {$w->supplier->company_name}",
                'user' => $rfq->recordedBy?->firstname . ' ' . $rfq->recordedBy?->lastname ?? 'System',
                'date' => $w->updated_at->format('M d, Y H:i'),
            ])
        );

    // --- PO Created ---
    $poActivities = PurchaseOrder::with('supplier', 'recordedBy')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->map(fn($po) => [
            'id' => $po->po_number,
            'action' => "Purchase Order Created for {$po->supplier->company_name}",
            'user' => $po->user?->firstname . ' ' . $po->user?->lastname ?? 'System',
            'date' => $po->created_at->format('M d, Y H:i'),
        ]);

    // --- IAR / Inspection ---
    $iarActivities = IAR::with('purchaseOrder.supplier', 'recordedBy')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->map(fn($iar) => [
            'id' => $iar->iar_number,
            'action' => "IAR Recorded: {$iar->purchaseOrder->po_number}",
            'user' => $iar->recordedBy?->firstname . ' ' . $iar->recordedBy?->lastname ?? 'System',
            'date' => $iar->created_at->format('M d, Y H:i'),
        ]);

    // ---- Recent Activity ----
    $risActivity = RIS::with(['requestedBy', 'issuedBy', 'items.inventoryItem'])
        ->latest('created_at')
        ->take(10)
        ->get()
        ->flatMap(fn($r) => $r->items->map(fn($item) => [
            'id' => $r->ris_number,
            'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
            'user' => $r->recordedBy?->firstname . ' ' . $r->recordedBy?->lastname ?? 'System',
            'date' => $item->created_at->format('M d, Y'),
        ]));

    $icsActivity = ICS::with('items.inventoryItem')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->flatMap(fn($i) => $i->items->map(fn($item) => [
            'id' => $i->ics_number,
            'action' => "Received {$item->quantity} {$item->inventoryItem->item_desc}",
            'user' => $i->recordedBy?->firstname . ' ' . $i->recordedBy?->lastname ?? 'System',
            'date' => $item->created_at->format('M d, Y'),
        ]));

    $parActivity = PAR::with('items.inventoryItem')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->flatMap(fn($p) => $p->items->map(fn($item) => [
            'id' => $p->par_number,
            'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
            'user' => $p->recordedBy?->firstname . ' ' . $p->recordedBy?->lastname ?? 'System',
            'date' => $item->created_at->format('M d, Y'),
        ]));

    $recentActivity = $prActivities->concat($rfqActivities)->concat($poActivities)->concat($iarActivities)->concat($risActivity)->concat($icsActivity)->concat($parActivity)
        ->sortByDesc(fn($a) => strtotime($a['date']))
        ->take(5)
        ->values();

    // ---- Stats Cards ----
    $stats = [
        ['label' => 'Total Stock Items', 'value' => $totalStock, 'icon' => 'Boxes', 'color' => 'bg-blue-100 text-blue-600'],
        ['label' => 'Pending Deliveries', 'value' => $pendingDeliveries, 'icon' => 'Truck', 'color' => 'bg-yellow-100 text-yellow-600'],
        ['label' => 'Total Issued Items', 'value' => $totalIssued, 'icon' => 'PackageCheck', 'color' => 'bg-green-100 text-green-600'],
        ['label' => 'Total Users', 'value' => $totalUsers, 'icon' => 'Users', 'color' => 'bg-purple-100 text-purple-600'],
        ['label' => 'Active Users', 'value' => $activeUsers, 'icon' => 'UserCog', 'color' => 'bg-teal-100 text-teal-600'],
    ];

    // ---- Document / Quick Link Cards ----
    $documents = [
        ['label'=> "RIS (Requisition)", 'value'=> $totalRis, 'icon'=> 'ClipboardList', 'link'=> "supply_officer.ris_issuance", 'color'=> "bg-purple-100 text-purple-600"],
        ['label'=> "ICS (High)", 'value'=> $totalIcsHigh, 'icon'=> 'FileSpreadsheet', 'link'=> "supply_officer.ics_issuance_high", 'color'=> "bg-pink-100 text-pink-600"],
        ['label'=> "ICS (Low)", 'value'=> $totalIcsLow, 'icon'=> 'FileSpreadsheet', 'link'=> "supply_officer.ics_issuance_low", 'color'=> "bg-indigo-100 text-indigo-600"],
        ['label'=> "PAR", 'value'=> $totalPar, 'icon'=> 'FileCheck', 'link'=> "supply_officer.par_issuance", 'color'=> "bg-orange-100 text-orange-600"],
        ['label'=> "Purchase Orders", 'value'=> $totalPo, 'icon'=> 'FileText', 'link'=> "supply_officer.purchase_orders", 'color'=> "bg-teal-100 text-teal-600"],
        ['label'=> "Issuance Logs", 'value'=> $totalIssued, 'icon'=> 'Layers', 'link'=> "supply_officer.ris_issuance", 'color'=> "bg-sky-100 text-sky-600"],
    ];

    // ---- Chart Data (Bar Chart: summary counts) ----
    $chartData = [
        ['type' => 'PR', 'count' => PurchaseRequest::count()],
        ['type' => 'PO', 'count' => $totalPo],
        ['type' => 'RIS', 'count' => $totalRis],
        ['type' => 'ICS', 'count' => $totalIcs],
        ['type' => 'PAR', 'count' => $totalPar],
    ];

    // ---- Activity Trend (Line Chart: last 7 days) ----
    $activityTrend = collect(range(6,0,-1))->map(fn($daysAgo) => [
        'date' => now()->subDays($daysAgo)->format('M d'),
        'activities' => PurchaseRequest::whereDate('created_at', now()->subDays($daysAgo))->count()
                        + PurchaseOrder::whereDate('created_at', now()->subDays($daysAgo))->count()
                        + RIS::whereDate('created_at', now()->subDays($daysAgo))->count()
                        + ICS::whereDate('created_at', now()->subDays($daysAgo))->count()
                        + PAR::whereDate('created_at', now()->subDays($daysAgo))->count(),
    ]);
    $prStatusChart = collect(range(6,0,-1))->map(fn($daysAgo) => [
        'date' => now()->subDays($daysAgo)->format('M d'),
        'Pending' => PurchaseRequest::whereDate('created_at', now()->subDays($daysAgo))
                        ->where('status', 'Pending')->count(),
        'Reviewed' => PurchaseRequest::whereDate('created_at', now()->subDays($daysAgo))
                        ->where('status', 'Reviewed')->count(),
        'Rejected' => PurchaseRequest::whereDate('created_at', now()->subDays($daysAgo))
                        ->where('status', 'Rejected')->count(),
    ]);


    // // ---- Issued Items per Division ----
    // $issuedPerDivision = Division::withCount(['issuedItems as issued' => fn($q) => $q->sum('quantity')])->get()
    //     ->map(fn($d) => ['division' => $d->name, 'issued' => $d->issued]);

    // ---- Users per Role Chart ----

    return Inertia::render('Admin/Dashboard', [
        'stats' => $stats,
        'documents' => $documents,
        'recentActivity' => $recentActivity,
        'user' => $user,
        'chartData' => $chartData,
        'activityTrend' => $activityTrend,
        'usersPerRoleChart' => $usersPerRoleChart,
        'prStatusChart' => $prStatusChart,
    ]);
}



public function activity_logs() {
    // --- Purchase Request Created ---
    $prActivities = PurchaseRequest::with('focal_person')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->map(fn($pr) => [
            'id' => $pr->pr_number,
            'action' => 'Purchase Request Created',
            'user' => $pr->focal_person?->firstname . ' ' . $pr->focal_person?->lastname,
            'date' => $pr->created_at->format('M d, Y H:i'),
        ]);

    // --- RFQ Winner Selected ---
    $rfqActivities = RFQ::with('details.supplier', 'recordedBy')
        ->latest('updated_at')
        ->take(10)
        ->get()
        ->flatMap(fn($rfq) => $rfq->details
            ->filter(fn($d) => $d->is_winner_as_calculated)
            ->map(fn($w) => [
                'id' => $rfq->id,
                'action' => "Winner Selected: {$w->supplier->company_name}",
                'user' => $rfq->recordedBy?->firstname . ' ' . $rfq->recordedBy?->lastname ?? 'System',
                'date' => $w->updated_at->format('M d, Y H:i'),
            ])
        );

    // --- PO Created ---
    $poActivities = PurchaseOrder::with('supplier', 'recordedBy')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->map(fn($po) => [
            'id' => $po->po_number,
            'action' => "Purchase Order Created for {$po->supplier->company_name}",
            'user' => $po->user?->firstname . ' ' . $po->user?->lastname ?? 'System',
            'date' => $po->created_at->format('M d, Y H:i'),
        ]);

    // --- IAR / Inspection ---
    $iarActivities = IAR::with('purchaseOrder.supplier', 'recordedBy')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->map(fn($iar) => [
            'id' => $iar->iar_number,
            'action' => "IAR Recorded: {$iar->purchaseOrder->po_number}",
            'user' => $iar->recordedBy?->firstname . ' ' . $iar->recordedBy?->lastname ?? 'System',
            'date' => $iar->created_at->format('M d, Y H:i'),
        ]);

    // --- RIS / Issuance Logs ---
    $risActivities = RIS::with('issuedBy', 'requestedBy', 'items.inventoryItem')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->flatMap(fn($r) => $r->items->map(fn($item) => [
            'id' => $r->ris_number,
            'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
            'issued_by' => $r->issuedBy?->firstname . ' ' . $r->issuedBy?->lastname ?? 'System',
            'issued_to' => $r->requestedBy?->firstname . ' ' . $r->requestedBy?->lastname ?? 'Unknown',
            'date' => $item->created_at->format('M d, Y H:i'),
        ]));

    // --- ICS / Received Logs ---
    $icsActivities = ICS::with('requestedBy', 'items.inventoryItem')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->flatMap(fn($i) => $i->items->map(fn($item) => [
            'id' => $i->ics_number,
            'action' => "Received {$item->quantity} {$item->inventoryItem->item_desc}",
            'issued_by' => $i->requestedBy?->firstname . ' ' . $i->requestedBy?->lastname ?? 'System',
            'issued_to' => 'Stock / Inventory',
            'date' => $item->created_at->format('M d, Y H:i'),
        ]));

    // --- PAR / Issuance Logs ---
    $parActivities = PAR::with('issuedBy', 'items.inventoryItem')
        ->latest('created_at')
        ->take(10)
        ->get()
        ->flatMap(fn($p) => $p->items->map(fn($item) => [
            'id' => $p->par_number,
            'action' => "Issued {$item->quantity} {$item->inventoryItem->item_desc}",
            'issued_by' => $p->issuedBy?->firstname . ' ' . $p->issuedBy?->lastname ?? 'System',
            'issued_to' => $item->assignedTo?->firstname . ' ' . $item->assignedTo?->lastname ?? 'Unknown',
            'date' => $item->created_at->format('M d, Y H:i'),
        ]));
        

    // --- Combine all activities ---
    $activities = $prActivities
        ->concat($rfqActivities)
        ->concat($poActivities)
        ->concat($iarActivities)
        ->concat($risActivities)
        ->concat($icsActivities)
        ->concat($parActivities)
        ->sortByDesc(fn($a) => strtotime($a['date']))
        ->values();

    return Inertia::render('Admin/ActivityLog', [
        'activities' => $activities
    ]);
}


    public function create_user_form() {
        $divisions = Division::all();
        $roles = Role::all(['id', 'name']);
        return Inertia::render('Admin/CreateUser', [
            'divisions' => $divisions,
            'roles' => $roles
        ]);
    }

    public function store_user(Request $request){
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'division_id'   => 'required|exists:tbl_divisions,id',
            'password'      => 'required|string|min:8|confirmed',
            'position'      => 'required|string|max:255',
            'account_status'=> 'nullable|in:active,inactive',
            'role'           => 'required|exists:roles,name',
        ]);
        
        $validated['password'] = bcrypt($validated['password']);
        $validated['email_verified_at'] = now(); 
        $user = User::create($validated);
        $user->assignRole($request->role);
        return redirect()
        ->route('admin.view_users')
        ->with('success', 'User created successfully.');
    }

    public function settings()
{
    $divisions = Division::with(['activeOfficer'])->get();

    // Get active inspection members
    $inspectionTeam = InspectionCommitteeMember::where('status', 'active')->get();

    // Get active BAC members
    $bacCommittee = BacCommitteeMember::where('status', 'active')->latest()->get();

    return inertia('Admin/Settings', [
        'divisions' => $divisions,
        'inspectionCommittees' => $inspectionTeam,
        'bacCommittees' => $bacCommittee,
    ]);
}
    public function edit_requesting(Division $division)
    {
        return inertia('Admin/EditRequesting', [
            'division' => $division,
            'activeOfficer' => $division->activeOfficer, // eager-loaded in model
        ]);
    }


    public function audit_logs(){
        $logs = AuditLogs::with('user') // assuming relation
            ->latest()
            ->get();

        return Inertia::render('Admin/AuditLogs', [
            'logs' => $logs,
        ]);
    }
    public function update_requesting(Request $request, Division $division)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Deactivate old officer if exists
        RequestedBy::where('division_id', $division->id)
            ->where('status', 'active')
            ->update(['status' => 'inactive']);

        // Add new officer
        RequestedBy::create([
            'division_id' => $division->id,
            'name' => $request->name,
            'status' => 'active',
        ]);

        return redirect()->route('admin.settings')
            ->with('success', 'Requisitioning officer updated successfully.');
    }

    public function deactivate(User $user)
{
    $user->account_status = 'inactive';
    $user->save();

    return back()->with('success', 'User has been deactivated.');
}
public function updateInspection(Request $request, $id)
{
    $validated = $request->validate([
        'member_id' => 'required|exists:tbl_inspection_committee_members,id',
        'replacementName' => 'required|string|max:255',
    ]);
    
    $committee = InspectionCommittee::findOrFail($id);

    $member = InspectionCommitteeMember::where('id', $validated['member_id'])
        ->where('inspection_committee_id', $committee->id)
        ->where('status', 'active')
        ->firstOrFail();

    // deactivate old member
    $member->update(['status' => 'inactive']);

    // create new member
    $newMember = InspectionCommitteeMember::create([
        'inspection_committee_id' => $committee->id,
        'position' => $member->position,
        'name' => $validated['replacementName'],
        'status' => 'active',
    ]);

    return back()->with('success', 'Inspection Committee updated successfully!');
}


public function updateBac(Request $request, $id)
{
    // Find the BacCommittee by ID
    $committee = BacCommittee::findOrFail($id);

    // Validate the incoming request
    $validated = $request->validate([
        'members' => 'required|array',
        'members.*.member_id' => 'nullable|exists:tbl_bac_committee_members,id',
        'members.*.position' => 'required|string|max:255',
        'members.*.name' => 'required|string|max:255',
    ]);

    // Loop over each member in the request
    foreach ($validated["members"] as $member) {
        // Check if the member already exists in the committee
        $existingMember = BacCommitteeMember::where('id', $member['member_id'])
            ->where('committee_id', $committee->id)
            ->where('status', 'active')
            ->firstOrFail();

        if ($existingMember) {
            // Deactivate the old member (selected member)
            $existingMember->update(['status' => 'inactive']);
        }

        // Add the new member
        BacCommitteeMember::create([
            'committee_id' => $committee->id,
            'position' => $member['position'],
            'name' => $member['name'],
            'status' => 'active',
        ]);
    }

    // Return success message and redirect
    return redirect()->route('admin.settings')
        ->with('success', 'BAC Committee updated successfully.');
}

    public function verify_password(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        // Check if the provided password matches the logged-in admin's password
        if (Hash::check($validated['password'], Auth::user()->password)) {
            return response()->json(['success' => true]);
        }

        // If the password doesn't match, return an error response
        return response()->json(['success' => false], 401);
    }
}
