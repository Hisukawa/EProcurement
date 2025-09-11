<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = ['pcs', 'box', 'set', 'kg', 'liter'];
        foreach ($units as $unit) {
            DB::table('tbl_units')->insert([
                'unit' => $unit,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
