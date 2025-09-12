<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Approver\ApproverController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Requester\RequesterController;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Supply\SupplyController;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();

        if ($user->roles->contains('name', 'admin')) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->roles->contains('name', 'requester')) {
            return redirect()->route('requester.dashboard');
        } elseif ($user->roles->contains('name', 'bac_approver')) {
            return redirect()->route('bac_approver.dashboard');
        } elseif ($user->roles->contains('name', 'supply_officer')) {
            return redirect()->route('supply_officer.dashboard');
        }

        // fallback if no role
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login')->withErrors([
            'email' => 'Your account does not have an assigned role.',
        ]);
    }

    // guest user → go to login route
    return redirect()->route('login');
});


// Notifications polling route
Route::middleware('auth')->get('/notifications', [NotificationController::class, 'fetch'])
    ->name('notifications.fetch');

// Mark notification as read route
Route::middleware('auth')->post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
    ->name('notifications.markAsRead');



// Admin routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::get('/view_users', [AdminController::class, 'view_users'])->name('admin.view_users');
    Route::get('/create_user_form', [AdminController::class, 'create_user_form'])->name('admin.create_user_form');
    Route::post('/store_user',[AdminController::class, 'store_user'])->name('admin.store_user');
    Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    Route::get('/edit_requesitioning{division}', [AdminController::class, 'edit_requesting'])->name('admin.edit_requesting');
    Route::post('/requesting-officers/{division}', [AdminController::class, 'update_requesting'])->name('admin.update_requesting');
    Route::get('/admin/audit-logs', [AdminController::class, 'audit_logs'])->name('admin.audit_logs');
    Route::post('/admin/inspection/{committee}/update', [AdminController::class, 'updateInspection'])->name('admin.update_inspection');
    Route::post('/admin/bac/{committee}/update', [AdminController::class, 'updateBac'])->name('admin.update_bac');
});

// Requester routes
Route::middleware(['auth', 'role:requester'])->prefix('requester')->group(function () {
    Route::get('/', [RequesterController::class, 'dashboard'])->name('requester.dashboard');
    Route::get('/create', [RequesterController::class, 'create'])->name('requester.create');
    Route::get('/create_product', [RequesterController::class, 'create_product'])->name('requester.create_product');
    Route::post('/store_product', [RequesterController::class, 'store_product'])->name('requester.store_product');
    Route::post('/store', [RequesterController::class, 'store'])->name('requester.store');
    Route::get('/manage_requests', [RequesterController::class, 'manage_requests'])->name('requester.manage_requests');
    Route::get('/add_details/{pr}', [RequesterController::class, 'add_details'])->name('requester.add_details');
    Route::post('/store_details/{pr}', [RequesterController::class, 'store_details'])->name('requester.store_details');
    Route::put('/update_details/{detail}', [RequesterController::class, 'update_details'])->name('requester.update_details');
    Route::delete('/delete_details/{detailId}', [RequesterController::class, 'delete_details'])->name('requester.delete_details');
    Route::get('/print/{id}', [RequesterController::class, 'print'])->name('requester.print');
    Route::post('/requests/{id}/send-for-approval', [RequesterController::class, 'sendForApproval'])->name('requester.pr.send_for_approval');
    Route::put('/{product}/update-price', [RequesterController::class, 'updatePrice'])->name('requester.update_price');
});

// Approver routes
Route::middleware(['auth', 'role:bac_approver'])->prefix('bac_approver')->group(function () {
    Route::get('/', [ApproverController::class, 'dashboard'])->name('bac_approver.dashboard');
    Route::get('/purchase_requests', [ApproverController::class, 'purchase_requests'])->name('bac_approver.purchase_requests');
    Route::get('/approved_requests', [ApproverController::class, 'approved_requests'])->name('bac_approver.approved_requests');
    Route::get('/generate_rfq/{pr}', [ApproverController::class, 'generate_rfq'])->name('bac_approver.generate_rfq');
    Route::post('/store_rfq', [ApproverController::class, 'store_rfq'])->name('bac_approver.store_rfq');
    Route::get('/print_rfq/{id}', [ApproverController::class, 'print_rfq'])->name('bac_approver.print_rfq');
    Route::get('/print_rfq_per_item/{rfq}/{detail}', [ApproverController::class, 'print_rfq_per_item'])->name('bac_approver.print_rfq_per_item');
    Route::get('/for_review', [ApproverController::class, 'for_review'])->name('bac_approver.for_review');
    Route::post('/approve/{pr}', [ApproverController::class, 'approve'])->name('bac_approver.approve');
    Route::get('/show_details/{pr}', [ApproverController::class, 'show_details'])->name('bac_approver.show_details');
    Route::get('/quoted_price/{pr}', [ApproverController::class, 'quoted_price'])->name('bac_approver.quoted_price');
    Route::get('/for_quotations', [ApproverController::class, 'for_quotations'])->name('bac_approver.for_quotations');
    Route::post('/submit_quoted', [ApproverController::class, 'submit_quoted'])->name('bac_approver.submit_quoted');
    Route::post('/submit_bulk_quoted', [ApproverController::class, 'submit_bulk_quoted'])->name('bac_approver.submit_bulk_quoted');
    Route::get('/abstract/{pr}', [ApproverController::class, 'abstract_of_quotations'])->name('bac_approver.abstract_of_quotations');
    Route::post('/mark-winner/{id}/{pr_detail_id?}', [ApproverController::class, 'markWinner'])->name('bac_approver.mark_winner');
    Route::get('/approver/print_aoq/{id}/{pr_detail_id?}', [ApproverController::class, 'printAOQ'])->name('bac_approver.print_aoq');
    Route::post('/store_supplier', [ApproverController::class, 'store_supplier'])->name('bac_approver.store_supplier');
    Route::post('/requests/{id}/send_back', [ApproverController::class, 'send_back'])->name('requester.send_back');
    Route::delete('/delete_quoted', [ApproverController::class, 'delete_quoted'])->name('bac_approver.delete_quoted');
    Route::post('/bac-committee/save', [ApproverController::class, 'save_committee'])->name('bac.committee.save');
    Route::post('/rollback-winner/{id}', [ApproverController::class, 'rollbackWinner'])
        ->name('bac_approver.rollback_winner');


});

// Supply Routes
Route::middleware(['auth', 'role:supply_officer'])->prefix('supply_officer')->group(function () {
    Route::get('/', [SupplyController::class, 'dashboard'])->name('supply_officer.dashboard');
    Route::get('/purchase_orders', [SupplyController::class, 'purchase_orders'])->name('supply_officer.purchase_orders');
    Route::get('/purchase_orders/create/{id}', [SupplyController::class, 'create_po'])->name('supply_officer.create_po');
    Route::post('/store_po', [SupplyController::class, 'store_po'])->name('supply_officer.store_po');
    Route::get('/manage_purchase_orders', [SupplyController::class, 'purchase_orders_table'])->name('supply_officer.purchase_orders_table');
    Route::get('/print_po/{id}', [SupplyController::class, 'print_po'])->name('supply_officer.print_po');
    Route::get('/record_iar/{id}', [SupplyController::class, 'record_iar'])->name('supply_officer.record_iar');
    Route::post('/store_iar', [SupplyController::class, 'store_iar'])->name('supply_officer.store_iar');
    Route::get('/iar_table', [SupplyController::class, 'iar_table'])->name('supply_officer.iar_table');
    Route::get('/print_iar/{id}', [SupplyController::class, 'print_iar'])->name('supply_officer.print_iar');
    Route::get('/inventory', [SupplyController::class, 'inventory'])->name('supply_officer.inventory');
    Route::get('/issuance/{po_id}/{inventory_id}', [SupplyController::class, 'issuance'])->name('supply_officer.issuance');
    Route::post('/store_ris', [SupplyController::class, 'store_ris'])->name('supply_officer.store_ris');
    Route::post('/store_ics', [SupplyController::class, 'store_ics'])->name('supply_officer.store_ics');
    Route::post('/store_par', [SupplyController::class, 'store_par'])->name('supply_officer.store_par');
    Route::get('/ris_issuance', [SupplyController::class, 'ris_issuance'])->name('supply_officer.ris_issuance');
    Route::get('/ics_issuance_low', [SupplyController::class, 'ics_issuance_low'])->name('supply_officer.ics_issuance_low');
    Route::get('/ics_issuance_high', [SupplyController::class, 'ics_issuance_high'])->name('supply_officer.ics_issuance_high');
    Route::get('/par_issuance', [SupplyController::class, 'par_issuance'])->name('supply_officer.par_issuance');
    Route::get('/export_excel', [SupplyController::class, 'export_excel'])->name('supply_officer.export_excel');
    Route::get('/export_excel_monthly', [SupplyController::class, 'export_excel_monthly'])->name('supply_officer.export_excel_monthly');
    Route::post('/inspection-committee/{id}/replace-member', [SupplyController::class, 'replaceMember'])->name('inspection.committee.save');

});
// Shared dashboard route
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/login', function(){
    return Inertia::render('Auth/Login');
})->name('login');

// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/updates', function () {
    return response()->json([
        'purchase_requests' => PurchaseRequest::latest()->take(10)->get(),
    ]);
})->middleware('auth:sanctum');

// Auth scaffolding
require __DIR__.'/auth.php';
