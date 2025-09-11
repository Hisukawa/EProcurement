<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Foreign key pools
        $userIds = DB::table('users')->pluck('id')->toArray();
        $poIds   = DB::table('tbl_purchase_orders')->pluck('id')->toArray();
        $unitIds = DB::table('tbl_units')->pluck('id')->toArray();
        $productIds = DB::table('tbl_products')->pluck('id')->toArray();

        $inventories = [];

        foreach ($poIds as $poId) {
            if ($faker->boolean(80)) {
                $productId = $faker->randomElement($productIds);
                $product   = DB::table('tbl_products')->find($productId);

                if (!$product) continue;

                $inventories[] = [
                    'recorded_by'   => $faker->randomElement($userIds),
                    'requested_by'  => $faker->randomElement($userIds),
                    'po_id'         => $poId,
                    'item_desc'     => $product->specs,   // 👈 match product specs
                    'total_stock'   => $faker->numberBetween(5, 500),
                    'unit_id'          => $product->unit_id, // 👈 match unit
                    'unit_cost'     => $faker->randomFloat(2, 50, 20000),
                    'last_received' => $faker->dateTimeBetween('-1 years', 'now')->format('Y-m-d'),
                    'status'        => $faker->randomElement(['Available', 'Issued']),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            }

            if (count($inventories) > 500) {
                DB::table('tbl_inventory')->insert($inventories);
                $inventories = [];
            }
        }

        if (!empty($inventories)) {
            DB::table('tbl_inventory')->insert($inventories);
        }
    }
}
