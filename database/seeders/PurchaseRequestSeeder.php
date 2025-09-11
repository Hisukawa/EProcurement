<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class PurchaseRequestSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign key IDs
        $userIds = DB::table('users')->pluck('id')->toArray();
        $divisionIds = DB::table('tbl_divisions')->pluck('id')->toArray();

        $requests = [];

        for ($i = 1; $i <= 500; $i++) {
            $requests[] = [
                'focal_person_user' => $faker->randomElement($userIds),
                'pr_number'         => strtoupper('PR-' . $faker->unique()->bothify('####-###')), // e.g. PR-2025-123
                'purpose'           => $faker->sentence(10),
                'division_id'       => $faker->randomElement($divisionIds),
                'requested_by'      => $faker->name,
                'status'            => $faker->randomElement(['Pending', 'Approved', 'Rejected']),
                'is_sent'           => $faker->boolean(70), // 70% chance sent
                'send_back_reason'  => $faker->optional(0.2)->sentence(8), // 20% chance has a reason
                'total_price'       => $faker->randomFloat(2, 1000, 200000), // between 1k – 200k
                'approval_image'    => $faker->optional(0.1)->imageUrl(640, 480, 'documents', true, 'Approval'), // 10% chance has image
                'created_at'        => $faker->dateTimeBetween('-2 years', 'now'),
                'updated_at'        => now(),
            ];

            // Insert in batches of 200 for speed
            if ($i % 200 === 0) {
                DB::table('tbl_purchase_requests')->insert($requests);
                $requests = [];
            }
        }

        // Insert any remaining
        if (!empty($requests)) {
            DB::table('tbl_purchase_requests')->insert($requests);
        }
    }
}
