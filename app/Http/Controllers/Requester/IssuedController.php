<?php

namespace App\Http\Controllers\Requester;

use App\Http\Controllers\Controller;
use App\Models\ICS;
use App\Models\Inventory;
use App\Models\PAR;
use App\Models\PurchaseOrder;
use App\Models\RIS;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IssuedController extends Controller
{
    public function ris_issued(Request $request)
    {
        $search = $request->input('search');
        $userId = Auth::id();

        $ris = RIS::with([
            'issuedTo.division',
            'issuedBy.division',
            'inventoryItem',
            'po.details.prDetail.purchaseRequest.division'
        ])
        ->where('issued_to', $userId)
        ->when($search, function ($query, $search) {
            $query->whereHas('inventoryItem', function ($q) use ($search) {
                $q->where('item_desc', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(10);

        return Inertia::render('Requester/RisIssued', [
            'ris' => $ris,
        ]);
    }

    public function ics_issued_low(Request $request){
        $search = $request->input('search');
        $userId = Auth::id();

        $ics = ICS::with([
            'receivedBy.division',
            'receivedFrom.division',
            'items.inventoryItem',
            'po.details.prDetail.purchaseRequest.division'
        ])
        ->where('received_by', $userId)
        ->where('type', 'low')
        ->when($search, function ($query, $search) {
            $query->whereHas('inventoryItem', function ($q) use ($search) {
                $q->where('item_desc', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(10);
        return Inertia::render('Requester/IcsIssuedLow',[
            'ics' => $ics,
        ]);
    }
    public function ics_issued_high(Request $request){
        $search = $request->input('search');
        $userId = Auth::id();

        $ics = ICS::with([
            'receivedBy.division',
            'receivedFrom.division',
            'items.inventoryItem',
            'po.details.prDetail.purchaseRequest.division'
        ])
        ->where('received_by', $userId)
        ->where('type', 'high')
        ->when($search, function ($query, $search) {
            $query->whereHas('inventoryItem', function ($q) use ($search) {
                $q->where('item_desc', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(10);
        return Inertia::render('Requester/IcsIssuedHigh',[
            'ics' => $ics
        ]);
    }
    public function par_issued(Request $request){
        $search = $request->input('search');
        $userId = Auth::id();

        $par = PAR::with([
            'receivedBy.division',
            'issuedBy.division',
            'items.inventoryItem',
            'po.details.prDetail.purchaseRequest.division'
        ])
        ->where('received_by', $userId)
        ->when($search, function ($query, $search) {
            $query->whereHas('inventoryItem', function ($q) use ($search) {
                $q->where('item_desc', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(10);
        return Inertia::render('Requester/ParIssued',[
            'par' => $par
        ]);
    }
}
