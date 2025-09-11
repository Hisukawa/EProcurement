<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class PODetailSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign keys
        $poIds = DB::table('tbl_purchase_orders')->pluck('id')->toArray();
        $prDetailIds = DB::table('tbl_pr_details')->pluck('id')->toArray();

        $poDetails = [];

        foreach ($poIds as $poId) {
            // Each PO gets 1–5 items
            $numItems = $faker->numberBetween(1, 5);
            $chosenPrDetails = $faker->randomElements($prDetailIds, $numItems);

            foreach ($chosenPrDetails as $prDetailId) {
                $quantity = $faker->randomFloat(0, 1, 50); // whole numbers
                $unitPrice = $faker->randomFloat(2, 100, 50000);
                $totalPrice = $quantity * $unitPrice;

                $poDetails[] = [
                    'po_id'       => $poId,
                    'pr_detail_id'=> $prDetailId,
                    'quantity'    => $quantity,
                    'unit_price'  => $unitPrice,
                    'total_price' => $totalPrice,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            }

            // Insert batch every 500
            if (count($poDetails) > 500) {
                DB::table('tbl_po_details')->insert($poDetails);
                $poDetails = [];
            }
        }

        // Insert remaining
        if (!empty($poDetails)) {
            DB::table('tbl_po_details')->insert($poDetails);
        }
    }
}
