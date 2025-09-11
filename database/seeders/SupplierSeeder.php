<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        
        // Fetch existing category IDs
        $categoryIds = DB::table('tbl_supply_categories')->pluck('id')->toArray();

        $suppliers = [];

        for ($i = 1; $i <= 50; $i++) {
            $suppliers[] = [
                'company_name'        => $faker->company,
                'address'             => $faker->address,
                'tin_num'             => $faker->unique()->numerify('###-###-###-###'),
                'representative_name' => $faker->name,
                'category_id'         => $faker->randomElement($categoryIds),
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        DB::table('tbl_suppliers')->insert($suppliers);
    }
}
