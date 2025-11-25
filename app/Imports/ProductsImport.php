<?php

namespace App\Imports;

use App\Models\Products;
use App\Models\Unit;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        // Normalize unit
        $unitName = trim($row['unit']);
        if (!$unitName) return null;

        // Get or create the unit
        $unit = Unit::firstOrCreate(['unit' => $unitName]);

        return new Products([
            'name'          => $row['name'] ?? 'Unnamed Product',
            'specs'         => $row['specs'] ?? null,
            'unit_id'       => $unit->id,
            'default_price' => $row['default_price'] ?? 0,
        ]);
    }
}
