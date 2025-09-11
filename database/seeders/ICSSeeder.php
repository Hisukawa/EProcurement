<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class IcsSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $userIds = DB::table('users')->pluck('id')->toArray();
        $inventoryIds = DB::table('tbl_inventory')->pluck('id')->toArray();
        $poIds = DB::table('tbl_purchase_orders')->pluck('id')->toArray();

        $icsRecords = [];

        foreach (range(1, 350) as $i) { // ~1/3 of total issuance
            $unitCost = $faker->randomFloat(2, 100, 5000);
            $qty = $faker->numberBetween(1, 20);

            $icsRecords[] = [
                'inventory_item_id' => $faker->randomElement($inventoryIds),
                'po_id'             => $faker->randomElement($poIds),
                'ics_number'        => 'ICS-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'received_by'       => $faker->randomElement($userIds),
                'received_from'     => $faker->randomElement($userIds),
                'quantity'          => $qty,
                'type'              => $faker->randomElement(['low', 'high']),
                'unit_cost'         => $unitCost,
                'total_cost'        => $qty * $unitCost,
                'remarks'           => $faker->sentence(),
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        DB::table('tbl_ics')->insert($icsRecords);
    }
}
