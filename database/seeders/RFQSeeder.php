<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class RFQSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign keys
        $userIds = DB::table('users')->pluck('id')->toArray();
        $purchaseRequestIds = DB::table('tbl_purchase_requests')->pluck('id')->toArray();

        $rfqs = [];

        // Each PR will have 1–3 RFQs
        foreach ($purchaseRequestIds as $prId) {
            $numRfqs = $faker->numberBetween(1, 3);

            for ($i = 0; $i < $numRfqs; $i++) {
                $rfqs[] = [
                    'user_id'   => $faker->randomElement($userIds),
                    'pr_id'     => $prId,
                    'grouped'   => $faker->boolean(80), // 80% chance grouped = true
                    'created_at'=> $faker->dateTimeBetween('-1 years', 'now'),
                    'updated_at'=> now(),
                ];
            }

            // Insert in batches of ~500
            if (count($rfqs) > 500) {
                DB::table('tbl_rfqs')->insert($rfqs);
                $rfqs = [];
            }
        }

        // Insert remaining
        if (!empty($rfqs)) {
            DB::table('tbl_rfqs')->insert($rfqs);
        }
    }
}
