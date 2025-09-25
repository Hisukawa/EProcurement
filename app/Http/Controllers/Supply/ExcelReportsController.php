<?php

namespace App\Http\Controllers\Supply;

use App\Exports\ICSReportExport;
use App\Exports\ICSReportExportHigh;
use App\Exports\RISExport;
use App\Exports\RISExportMonthly;
use App\Exports\RISReportGenerate;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExcelReportsController extends Controller
{
    

    public function export_excel(Request $request)
    {
        $month = $request->input('month');
        $year  = $request->input('year');

        // Default filename (with date if provided)
        $fileName = 'RIS_Report';
        if ($month && $year) {
            $fileName .= '_' . date("F", mktime(0, 0, 0, $month, 10)) . '_' . $year;
        } elseif ($year) {
            $fileName .= '_' . $year;
        }

        return Excel::download(
            new RISExport($month, $year),
            $fileName . '.xlsx'
        );
    }

    public function generate_report(Request $request)
    {
        $month = $request->query('month');
        $year  = $request->query('year');

        $fileName = 'RIS_Report_Generated_' . date("F", mktime(0, 0, 0, $month, 10)) . '_' . $year . '.xlsx';

        return Excel::download(
            new RISReportGenerate($month, $year),
            $fileName
        );
    }

    public function generateIcsReport(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
        $type = $request->input('type', 'low'); // default low if not passed

        // Convert type to Title Case (e.g., "low" -> "Low", "high" -> "High")
        $typeTitle = ucfirst(strtolower($type));

        return Excel::download(
            new ICSReportExport($month, $year, $type),
            "ICS_{$typeTitle}_Report_{$year}.xlsx"
        );
    }
    public function generateIcsReportHigh(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
        $type = $request->input('type', 'high'); // default low if not passed

        // Convert type to Title Case (e.g., "low" -> "Low", "high" -> "High")
        $typeTitle = ucfirst(strtolower($type));

        return Excel::download(
            new ICSReportExportHigh($month, $year, $type),
            "ICS_{$typeTitle}_Report_{$year}.xlsx"
        );
    }

}
