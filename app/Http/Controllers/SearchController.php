<?php
namespace App\Http\Controllers;

use App\Models\ICSItems;
use Illuminate\Http\Request;
use App\Models\PPESubMajorAccount;
use App\Models\GeneralLedgerAccount;
use App\Models\Office;
use App\Models\School;

class SearchController extends Controller
{
    public function searchPpe(Request $request)
    {
        $q = $request->input('q');
        return PPESubMajorAccount::where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id','code','name']);
    }

    public function searchGl(Request $request)
    {
        $q = $request->input('q');
        return GeneralLedgerAccount::where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id','code','name']);
    }

    public function searchOffice(Request $request)
    {
        $q = $request->input('q');
        return Office::where('name', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id','code','name']);
    }

    public function searchSchool(Request $request)
    {
        $q = $request->input('q');
        return School::where('name', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id','code','name']);
    }
    public function getNextSeries(Request $request)
{
    try {
        $type = $request->input('type'); // e.g. "low" or "high"

        // Get the last series from ICSItems and PARItems for the current year
        $lastIcsSeries = \App\Models\ICSItems::whereYear('created_at', now()->year)
            ->max('series_number');

        $lastParSeries = \App\Models\PARItems::whereYear('created_at', now()->year)
            ->max('series_number');

        // Convert both to integers for comparison
        $lastIcsNum = $lastIcsSeries ? (int) $lastIcsSeries : 0;
        $lastParNum = $lastParSeries ? (int) $lastParSeries : 0;

        // Get the highest between both
        $highest = max($lastIcsNum, $lastParNum);

        // Increment to get the next series number
        $nextNumeric = $highest + 1;

        // Format back to 4 digits (e.g. 0002, 0010, 0123)
        $formatted = str_pad($nextNumeric, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'series'    => $formatted,
            'formatted' => $formatted,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
        ], 500);
    }
}
}

