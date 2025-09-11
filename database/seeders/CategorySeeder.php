<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tbl_categories')->insert([
            [
                'name' => 'Consumable',
                'description' => 'Items that are used up or discarded after use (e.g., paper, pens)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Semi-Expendable',
                'description' => 'Low-value equipment or property not immediately consumed but not classified as fixed assets',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Non-Expendable',
                'description' => 'Fixed assets or equipment with significant value or long-term use (e.g., computers, printers)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
