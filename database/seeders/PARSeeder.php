<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class ParSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $userIds = DB::table('users')->pluck('id')->toArray();
        $inventoryIds = DB::table('tbl_inventory')->pluck('id')->toArray();
        $poIds = DB::table('tbl_purchase_orders')->pluck('id')->toArray();

        $parRecords = [];

        foreach (range(1, 300) as $i) { // ~1/3 of total issuance
            $unitCost = $faker->randomFloat(2, 5000, 100000);
            $qty = $faker->numberBetween(1, 5);

            $parRecords[] = [
                'inventory_item_id' => $faker->randomElement($inventoryIds),
                'po_id'             => $faker->randomElement($poIds),
                'par_number'        => 'PAR-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'received_by'       => $faker->randomElement($userIds),
                'issued_by'         => $faker->randomElement($userIds),
                'quantity'          => $qty,
                'unit_cost'         => $unitCost,
                'total_cost'        => $qty * $unitCost,
                'property_no'       => 'PROP-' . strtoupper($faker->bothify('??###')),
                'remarks'           => $faker->sentence(),
                'date_acquired'     => $faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        DB::table('tbl_par')->insert($parRecords);
    }
}
