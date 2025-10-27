<?php

namespace App\Http\Controllers\Supply;

use App\Exports\ICSReportExport;
use App\Exports\ICSReportExportHigh;
use App\Exports\ParReportExport;
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
        $search = $request->query('search');

        $fileName = 'RIS_Report_Generated_' . date("F", mktime(0, 0, 0, $month, 10)) . '_' . $year . '_' . $search . '.xlsx';

        return Excel::download(
            new RISReportGenerate($month, $year, $search),
            $fileName
        );
    }

    public function generateIcsReport(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
        $search = $request->input('search');
        $type = $request->input('type', 'low'); // default low if not passed

        // Convert type to Title Case (e.g., "low" -> "Low", "high" -> "High")
        $typeTitle = ucfirst(strtolower($type));

        return Excel::download(
            new ICSReportExport($month, $year, $type, $search),
            "ICS_{$typeTitle}_Report_{$year}_{$search}.xlsx"
        );
    }
    public function generateIcsReportHigh(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
        $search = $request->input('search');
        $type = $request->input('type', 'high');

        // Convert type to Title Case (e.g., "low" -> "Low", "high" -> "High")
        $typeTitle = ucfirst(strtolower($type));

        return Excel::download(
            new ICSReportExportHigh($month, $year, $type, $search),
            "ICS_{$typeTitle}_Report_{$year}_{$search}.xlsx"
        );
    }
    public function generateParReport(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
        $search = $request->input('search');

        return Excel::download(
            new ParReportExport($month, $year, $search),
            "PAR_Report_{$year}_{$search}.xlsx"
        );
    }

}
