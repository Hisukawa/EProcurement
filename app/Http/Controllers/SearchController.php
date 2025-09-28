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
        $type = $request->input('type'); // "low" or "high"

        // Get the last series just by type (low/high) for the current year
        $lastSeries = ICSItems::whereYear('created_at', now()->year)
            ->where('type', $type)
            ->max('series_number'); // e.g. "0007"

        // Convert to integer, increment, then pad back to 4 digits
        $lastNumeric = $lastSeries ? (int) $lastSeries : 0;
        $nextNumeric = $lastNumeric + 1;
        $formatted = str_pad($nextNumeric, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'series'    => $formatted,   // "0008"
            'formatted' => $formatted,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
        ], 500);
    }
}






}
