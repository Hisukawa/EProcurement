<?php

namespace App\Http\Controllers;

use App\Imports\ProductsImport;
use App\Models\Products;
use App\Models\Unit;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductImportController extends Controller
{
    public function downloadProductTemplate(): BinaryFileResponse
    {
        $filePath = public_path('templates/product_import_template.xlsx');

        return response()->download($filePath, 'product_template.xlsx');
    }

public function import(Request $request)
{
    $request->validate([
        'file' => 'required|mimes:xlsx,csv',
    ]);

    try {
        Excel::import(new ProductsImport, $request->file('file'));
        return response()->json(['success' => true]);

    } catch (\Exception $e) {
        return response()->json(['success' => false], 500);
    }
}

}
