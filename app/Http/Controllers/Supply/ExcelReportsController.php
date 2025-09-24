<?php

namespace App\Http\Controllers\Supply;

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
        $month = $request->input('month'); // Example: 3 (March)
        $year  = $request->input('year');  // Example: 2025


        // File name example: RIS_Report_March_2025.xlsx
        $fileName = 'RIS_Report_Generated' . date("F", mktime(0, 0, 0, $month, 10)) . '_' . $year . '.xlsx';

        return Excel::download(
            new RISReportGenerate($month, $year),
            $fileName
        );
    }
}
