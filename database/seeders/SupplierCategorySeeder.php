<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = ['Local', 'International', 'Wholesale', 'Retail'];
        foreach ($categories as $cat) {
            DB::table('tbl_supply_categories')->insert([
                'name' => $cat,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
