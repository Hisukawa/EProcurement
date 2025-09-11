<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class RisSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $userIds = DB::table('users')->pluck('id')->toArray();
        $inventoryIds = DB::table('tbl_inventory')->pluck('id')->toArray();
        $poIds = DB::table('tbl_purchase_orders')->pluck('id')->toArray();

        $risRecords = [];

        foreach (range(1, 350) as $i) { // ~1/3 of total issuance
            $inventoryId = $faker->randomElement($inventoryIds);

            $risRecords[] = [
                'inventory_item_id' => $inventoryId,
                'po_id'             => $faker->randomElement($poIds),
                'ris_number'        => 'RIS-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'issued_to'         => $faker->randomElement($userIds),
                'issued_by'         => $faker->randomElement($userIds),
                'quantity'          => $faker->numberBetween(1, 50),
                'remarks'           => $faker->sentence(),
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        DB::table('tbl_ris')->insert($risRecords);
    }
}
