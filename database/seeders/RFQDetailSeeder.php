<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class RFQDetailSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign key IDs
        $rfqIds = DB::table('tbl_rfqs')->pluck('id')->toArray();
        $prDetailsIds = DB::table('tbl_pr_details')->pluck('id')->toArray();
        $supplierIds = DB::table('tbl_suppliers')->pluck('id')->toArray();
        $committeeIds = DB::table('tbl_bac_committees')->pluck('id')->toArray();

        $rfqDetails = [];

        // Loop through RFQs and assign suppliers’ quotes
        foreach ($rfqIds as $rfqId) {
            // Pick random PR details for this RFQ
            $numItems = $faker->numberBetween(1, 5);
            $rfqPrDetails = $faker->randomElements($prDetailsIds, $numItems);

            foreach ($rfqPrDetails as $prDetailId) {
                // Each PR detail gets 2–4 supplier quotes
                $numSuppliers = $faker->numberBetween(2, 4);
                $chosenSuppliers = $faker->randomElements($supplierIds, $numSuppliers);

                $winnerIndex = $faker->numberBetween(0, $numSuppliers - 1);

                foreach ($chosenSuppliers as $idx => $supplierId) {
                    $quotedPrice = $faker->randomFloat(2, 500, 100000);

                    $rfqDetails[] = [
                        'rfq_id'        => $rfqId,
                        'pr_details_id' => $prDetailId,
                        'quoted_price'  => $quotedPrice,
                        'supplier_id'   => $supplierId,
                        'is_winner'     => $idx === $winnerIndex ? 1 : 0, // mark one as winner
                        'remarks'       => $faker->optional(0.2)->sentence(6),
                        'committee_id'  => $faker->optional()->randomElement($committeeIds),
                        'created_at'    => $faker->dateTimeBetween('-1 years', 'now'),
                        'updated_at'    => now(),
                    ];
                }
            }

            // Insert batch every ~500 for performance
            if (count($rfqDetails) > 500) {
                DB::table('tbl_rfq_details')->insert($rfqDetails);
                $rfqDetails = [];
            }
        }

        // Insert remaining
        if (!empty($rfqDetails)) {
            DB::table('tbl_rfq_details')->insert($rfqDetails);
        }
    }
}
