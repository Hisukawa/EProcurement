<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            'pcs',        // piece
            'box',        // box/package
            'set',        // set
            'kg',         // kilogram
            'gram',       // gram
            'liter',      // liter
            'pack',       // small pack
            'ream',       // paper ream
            'roll',       // roll (e.g., tape)
            'bottle',     // liquid bottles
            'lot',
            'unit'
        ];

        foreach ($units as $unit) {
            DB::table('tbl_units')->insert([
                'unit' => $unit,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
