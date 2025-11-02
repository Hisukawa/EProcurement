<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Approver\AbstractController;
use App\Http\Controllers\Approver\ApproverController;
use App\Http\Controllers\Approver\ApprovingProcessController;
use App\Http\Controllers\Approver\PrintContoller;
use App\Http\Controllers\Approver\PrintController;
use App\Http\Controllers\Approver\QuotationController;
use App\Http\Controllers\Approver\RFQController;
use App\Http\Controllers\PARSearchController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Requester\IssuedController;
use App\Http\Controllers\Requester\RequesterController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Supply\IssuanceController;
use App\Http\Controllers\Supply\ReturnController;
use App\Http\Controllers\Supply\SwitchTypeController;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Requester\PurchaseRequestController;
use App\Http\Controllers\Supply\DisposedItemsController;
use App\Http\Controllers\Supply\ExcelReportsController;
use App\Http\Controllers\Supply\ReissuanceController;
use App\Http\Controllers\Supply\SupplyController;
use App\Http\Controllers\TwgUserController\TwgController;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();

        if ($user->roles->contains('name', 'admin')) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->roles->contains('name', 'requester')) {
            return redirect()->route('requester.dashboard');
        } elseif ($user->roles->contains('name', 'bac_user')) {
            return redirect()->route('bac_user.dashboard');
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
    Route::post('/verify_password', [AdminController::class, 'verify_password'])->name('admin.verify_password');
    Route::get('/activity_logs', [AdminController::class, 'activity_logs'])->name('admin.activity_logs');
    Route::get('/view_users', [AdminController::class, 'view_users'])->name('admin.view_users');
    Route::put('/users/{id}', [AdminController::class, 'update_user'])->name('admin.update_user');
    Route::get('/create_user_form', [AdminController::class, 'create_user_form'])->name('admin.create_user_form');
    Route::post('/store_user',[AdminController::class, 'store_user'])->name('admin.store_user');
    Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    Route::get('/edit_requesitioning{division}', [AdminController::class, 'edit_requesting'])->name('admin.edit_requesting');
    Route::post('/requesting-officers/{division}', [AdminController::class, 'update_requesting'])->name('admin.update_requesting');
    Route::get('/admin/audit-logs', [AdminController::class, 'audit_logs'])->name('admin.audit_logs');
    Route::post('/update-inspection/{id}', [AdminController::class, 'updateInspection'])->name('admin.update_inspection');
    Route::post('/update-bac/{id}', [AdminController::class, 'updateBac'])->name('admin.update_bac');
    Route::put('/admin/users/{user}/deactivate', [AdminController::class, 'deactivate'])->name('admin.deactivate_user');
    Route::post('/add_division', [AdminController::class, 'add_division'])->name('admin.add_division');
    Route::put('/update_division/{id}', [AdminController::class, 'update_division'])->name('admin.update_division');
});

// Requester routes
Route::middleware(['auth', 'role:requester'])->prefix('requester')->group(function () {
    Route::get('/', [RequesterController::class, 'dashboard'])->name('requester.dashboard');
    Route::get('/manage_requests', [RequesterController::class, 'manage_requests'])->name('requester.manage_requests');
    Route::get('/print/{id}', [RequesterController::class, 'print'])->name('requester.print');
    Route::post('/requests/{id}/send-for-approval', [RequesterController::class, 'sendForReview'])->name('requester.pr.send_for_approval');
    Route::get('/create', [PurchaseRequestController::class, 'create'])->name('requester.create');
    Route::get('/create_product', [RequesterController::class, 'create_product'])->name('requester.create_product');
    Route::post('/store_product', [PurchaseRequestController::class, 'store_product'])->name('requester.store_product');
    Route::post('/store', [PurchaseRequestController::class, 'store'])->name('requester.store');
    Route::get('/add_details/{pr}', [PurchaseRequestController::class, 'add_details'])->name('requester.add_details');
    Route::post('/store_details/{pr}', [PurchaseRequestController::class, 'store_details'])->name('requester.store_details');
    Route::put('/update_details/{detail}', [PurchaseRequestController::class, 'update_details'])->name('requester.update_details');
    Route::delete('/delete_details/{detailId}', [PurchaseRequestController::class, 'delete_details'])->name('requester.delete_details');
    Route::put('/{product}/update-price', [PurchaseRequestController::class, 'updatePrice'])->name('requester.update_price');
    Route::post('/units', [PurchaseRequestController::class, 'storeUnit'])->name('requester.store_unit');
    Route::get('/ris_issued', [IssuedController::class, 'ris_issued'])->name('requester.ris_issued');
    Route::get('/ics_issued_low', [IssuedController::class, 'ics_issued_low'])->name('requester.ics_issued_low');
    Route::get('/ics_issued_high', [IssuedController::class, 'ics_issued_high'])->name('requester.ics_issued_high');
    Route::get('/par_issued', [IssuedController::class, 'par_issued'])->name('requester.par_issued');
    Route::put('/update_purpose/{pr}', [PurchaseRequestController::class, 'updatePurpose'])->name('requester.update_purpose');
});

Route::middleware(['auth','role:twg_user'])->prefix('twg_user')->group(function () {
    Route::get('/', [TwgController::class, 'dashboard'])->name('twg_user.dashboard');
    Route::get('/for_review', [TwgController::class, 'for_review'])->name('twg_user.for_review');
    Route::get('/show_details/{pr}', [TwgController::class, 'show_details'])->name('twg_user.show_details');
    Route::post('/review/{pr}', [TwgController::class, 'review'])->name('twg_user.review');
    Route::post('/requests/{id}/send_back', [TwgController::class, 'send_back'])->name('twg_user.send_back');
    Route::post('/submit_review/{pr}', [TwgController::class, 'submit_review'])->name('twg_user.submit_review');
    Route::post(('reject/{id}'), [TwgController::class, 'reject'])->name('twg_user.reject');
});

// Approver routes
Route::middleware(['auth', 'role:bac_user'])->prefix('bac_user')->group(function () {
    Route::get('/', [ApproverController::class, 'dashboard'])->name('bac_user.dashboard');
    Route::get('/purchase_requests', [ApprovingProcessController::class, 'purchase_requests'])->name('bac_user.purchase_requests');
    Route::get('/approved_requests', [ApprovingProcessController::class, 'approved_requests'])->name('bac_user.approved_requests');
    Route::get('/generate_rfq/{pr}', [RFQController::class, 'generate_rfq'])->name('bac_user.generate_rfq');
    Route::post('/store_rfq', [RFQController::class, 'store_rfq'])->name('bac_user.store_rfq');
    Route::get('/print_rfq/{id}', [PrintController::class, 'print_rfq'])->name('bac_user.print_rfq');
    Route::get('/print_rfq_selected/{pr}', [PrintController::class, 'print_rfq_selected'])->name('bac_user.print_rfq_selected');
    Route::get('/quoted_price/{pr}', [QuotationController::class, 'quoted_price'])->name('bac_user.quoted_price');
    Route::get('/for_quotations', [QuotationController::class, 'for_quotations'])->name('bac_user.for_quotations');
    Route::post('/submit_quoted', [QuotationController::class, 'submit_quoted'])->name('bac_user.submit_quoted');
    Route::post('/submit_bulk_quoted', [QuotationController::class, 'submit_bulk_quoted'])->name('bac_user.submit_bulk_quoted');
    Route::get('/abstract/{pr}', [AbstractController::class, 'abstract_of_quotations'])->name('bac_user.abstract_of_quotations');
    Route::get('/abstract/{pr}/calculated', [AbstractController::class, 'abstract_of_quotations_calculated'])->name('bac_user.abstract_of_quotations_calculated');
    Route::post('/abstract/{id}/save-unit-price', [AbstractController::class, 'saveUnitPrice'])->name('bac_user.save_unit_price');
    Route::post('/mark-winner/{id}/{pr_detail_id?}', [AbstractController::class, 'markWinner'])->name('bac_user.mark_winner');
    Route::post('/mark-winner-as-calculated/{id}/{pr_detail_id?}', [AbstractController::class, 'markWinnerAsCalculated'])->name('bac_user.mark_winner_as_calculated');
    Route::get('/approver/print_aoq/{id}/{pr_detail_id?}', [PrintController::class, 'printAOQ'])->name('bac_user.print_aoq');
    Route::get('/approver/print_aoq_calculated/{id}/{pr_detail_id?}', [PrintController::class, 'printAOQCalculated'])->name('bac_user.print_aoq_calculated');
    Route::get('/approver/print_aoq_per_item_grouped/{id}', [PrintController::class, 'printAoqPerItemGrouped'])->name('bac_user.print_aoq_per_item_grouped');
    Route::post('/store_supplier', [ApproverController::class, 'store_supplier'])->name('bac_user.store_supplier');
    Route::delete('/delete_quoted', [QuotationController::class, 'delete_quoted'])->name('bac_user.delete_quoted');
    Route::post('/bac-committee/save', [ApproverController::class, 'save_committee'])->name('bac.committee.save');
    Route::post('/rollback-winner-as-read/{id}', [AbstractController::class, 'rollbackWinnerAsRead'])->name('bac_user.rollback_winner_as_read');
    Route::post('/rollback-winner-as-calculated/{id}', [AbstractController::class, 'rollbackWinnerAsCalculated'])->name('bac_user.rollback_winner_as_calculated');
    Route::post('/save-remarks-as-read/{id}/{pr_detail_id?}', [AbstractController::class, 'saveRemarksAsRead'])->name('bac_user.save_remarks_as_read');
    Route::post('/save-remarks-as-calculated/{id}/{pr_detail_id?}', [AbstractController::class, 'saveRemarksAsCalculated'])->name('bac_user.save_remarks_as_calculated');
    Route::post('/submit-project-info/{id}', [ApproverController::class, 'submit_project_info'])->name('bac_user.submit_project_info');
    // routes/web.php
Route::get('/bac/rfqs/{id}/print-aoq-per-item-grouped-read',
  [PrintController::class, 'printAoqPerItemGroupedRead']
)->name('bac_user.print_aoq_per_item_grouped_read');

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
    Route::get('/issuance/{po_detail_id}/{inventory_id}', [IssuanceController::class, 'issuance'])->name('supply_officer.issuance');
    Route::post('/store_ris', [IssuanceController::class, 'store_ris'])->name('supply_officer.store_ris');
    Route::post('/store_ics', [IssuanceController::class, 'store_ics'])->name('supply_officer.store_ics');
    Route::post('/store_par', [IssuanceController::class, 'store_par'])->name('supply_officer.store_par');
    Route::get('/ris_issuance', [IssuanceController::class, 'ris_issuance'])->name('supply_officer.ris_issuance');
    Route::get('/ics_issuance_low', [IssuanceController::class, 'ics_issuance_low'])->name('supply_officer.ics_issuance_low');
    Route::get('/ics_issuance_high', [IssuanceController::class, 'ics_issuance_high'])->name('supply_officer.ics_issuance_high');
    Route::get('/par_issuance', [IssuanceController::class, 'par_issuance'])->name('supply_officer.par_issuance');
    Route::get('/export_excel', [ExcelReportsController::class, 'export_excel'])->name('supply_officer.export_excel');
    Route::get('/generate_report', [ExcelReportsController::class, 'generate_report'])->name('supply_officer.generate_report');
    Route::post('/inspection-committee/{id}/replace-member', [SupplyController::class, 'replaceMember'])->name('inspection.committee.save');
    Route::get('/print_ris/{id}', [IssuanceController::class, 'print_ris'])->name('supply_officer.print_ris');
    // routes/web.php
    Route::get('/ris/{ris}/item/{item}/print', [IssuanceController::class, 'printRisItem'])
        ->name('supply_officer.print_ris_item');

    Route::get('/print_ics/{id}/{types?}', [IssuanceController::class, 'print_ics'])->name('supply_officer.print_ics');
    Route::get('/print_ics_all/{id}', [IssuanceController::class, 'print_ics_all'])->name('supply_officer.print_ics_all');
    Route::get('/print_par/{id}', [IssuanceController::class, 'print_par'])->name('supply_officer.print_par');
    Route::get('/supply-officer/generate-ics-report', [ExcelReportsController::class, 'generateIcsReport'])->name('supply_officer.generate_ics_report');
    Route::get('/supply-officer/generate-ics-report-high', [ExcelReportsController::class, 'generateIcsReportHigh'])->name('supply_officer.generate_ics_report_high');
    Route::get('/supply-officer/generate-par-report', [ExcelReportsController::class, 'generateParReport'])->name('supply_officer.generate_par_report');

    Route::get('/switch_type/{type}/{id}', [SwitchTypeController::class, 'switchType'])->name('supply_officer.switch_type');
    Route::post('/switch_to_ris', [SwitchTypeController::class, 'switchToRis'])->name('supply_officer.switch_to_ris');
    Route::post('/switch_to_ics', [SwitchTypeController::class, 'switchToIcs'])->name('supply_officer.switch_to_ics');
    Route::post('/switch_to_par', [SwitchTypeController::class, 'switchToPar'])->name('supply_officer.switch_to_par');

    Route::get('/reissuance', [ReturnController::class, 'reissuance'])->name('supply_officer.reissuance');
    Route::get('/reissuance/{type}/{id}', [ReturnController::class, 'reissuance_form'])->name('supply_officer.reissuance_form');
    Route::post('/submit_reissuance', [ReturnController::class, 'submit_reissuance'])->name('supply_officer.submit_reissuance');
    Route::get('reissued_items', [ReturnController::class, 'reissued_items'])->name('supply_officer.reissued_items');
    Route::get('/disposal/{type}/{id}', [ReturnController::class, 'disposal_form'])->name('supply_officer.disposal_form');
    Route::post('/submit_disposal', [ReturnController::class, 'submit_disposal'])->name('supply_officer.submit_disposal');
    Route::get('/disposed_items', [ReturnController::class, 'disposed_items'])->name('supply_officer.disposed_items');

    Route::get('/print_disposed_items/{id}', [ReturnController::class, 'print_disposed_items'])->name('supply_officer.print_disposed_items');
    Route::get('/print_reissued_items/{id}', [ReturnController::class, 'print_reissued_items'])->name('supply_officer.print_reissued_items');

    Route::get('/suppliers', [SupplyController::class, 'suppliers'])->name('supply_officer.suppliers');
    Route::post('/suppliers/add', [SupplyController::class, 'add_supplier'])->name('supply_officer.add_supplier');
    Route::put('/update_supplier/{id}', [SupplyController::class, 'update_supplier'])->name('supply_officer.update_supplier');
    Route::put('/delete_supplier/{id}', [SupplyController::class, 'delete_supplier'])->name('supply_officer.delete_supplier');
    Route::put('/activate_supplier/{id}', [SupplyController::class, 'activate_supplier'])->name('supply_officer.activate_supplier');

    Route::post('/supply_officer/reissued-items/update/{id}', [ReturnController::class, 'updateReissuedItem'])->name('supply_officer.update_reissued_item');

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

Route::get('/api/ppe-search', [SearchController::class, 'searchPpe']); 
Route::get('/api/gl-search', [SearchController::class, 'searchGl']); 
Route::get('/api/office-search', [SearchController::class, 'searchOffice']); 
Route::get('/api/school-search', [SearchController::class, 'searchSchool']);
Route::get('/api/ics-next-series', [SearchController::class, 'getNextSeries']);

Route::get('/api/ppe-search', [PARSearchController::class, 'searchPpe']); 
Route::get('/api/gl-search', [PARSearchController::class, 'searchGl']); 
Route::get('/api/office-search', [PARSearchController::class, 'searchOffice']); 
Route::get('/api/school-search', [PARSearchController::class, 'searchSchool']);
Route::get('/api/par-next-series', [PARSearchController::class, 'getNextSeries']);


Route::get('/updates', function () {
    return response()->json([
        'purchase_requests' => PurchaseRequest::latest()->take(10)->get(),
    ]);
})->middleware('auth:sanctum');

// Auth scaffolding
require __DIR__.'/auth.php';
