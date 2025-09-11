<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class PRDetailSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign keys
        $purchaseRequestIds = DB::table('tbl_purchase_requests')->pluck('id')->toArray();
        $productIds = DB::table('tbl_products')->pluck('id')->toArray();

        $details = [];

        // Each PR will have between 1–5 products
        foreach ($purchaseRequestIds as $prId) {
            $numProducts = $faker->numberBetween(1, 5);

            for ($i = 0; $i < $numProducts; $i++) {
                $productId = $faker->randomElement($productIds);

                $quantity = $faker->randomFloat(0, 1, 50); // whole numbers (1–50)
                $unitPrice = $faker->randomFloat(2, 100, 50000); // 100–50,000
                $totalPrice = $quantity * $unitPrice;

                $details[] = [
                    'pr_id'            => $prId,
                    'product_id'       => $productId,
                    'item'             => $faker->words(3, true), // fallback snapshot name
                    'specs'            => $faker->sentence(10),
                    'unit'             => $faker->randomElement(['pcs', 'box', 'set', 'pack']),
                    'quantity'         => $quantity,
                    'unit_price'       => $unitPrice,
                    'total_item_price' => $totalPrice,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }

            // Insert batch every ~500 records for performance
            if (count($details) > 500) {
                DB::table('tbl_pr_details')->insert($details);
                $details = [];
            }
        }

        // Insert remaining
        if (!empty($details)) {
            DB::table('tbl_pr_details')->insert($details);
        }
    }
}
