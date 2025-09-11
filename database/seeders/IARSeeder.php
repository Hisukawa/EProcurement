<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class IARSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign key IDs
        $poIds = DB::table('tbl_purchase_orders')->pluck('id')->toArray();
        $unitIds = DB::table('tbl_units')->pluck('id')->toArray();
        $inspectionCommitteeIds = DB::table('tbl_inspection_committees')->pluck('id')->toArray();

        $iars = [];

        foreach ($poIds as $index => $poId) {
            // ~70% of POs generate an IAR
            if ($faker->boolean(70)) {
                $quantityOrdered  = $faker->numberBetween(1, 100);
                $quantityReceived = $faker->numberBetween(0, $quantityOrdered);
                $unitPrice        = $faker->randomFloat(2, 100, 50000);
                $totalPrice       = $quantityReceived * $unitPrice;

                $iars[] = [
                    'po_id'                   => $poId,
                    'iar_number'              => strtoupper('IAR-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT)),
                    'specs'                   => $faker->sentence(8),
                    'unit'                 => $faker->randomElement($unitIds),
                    'quantity_ordered'        => $quantityOrdered,
                    'quantity_received'       => $quantityReceived,
                    'unit_price'              => $unitPrice,
                    'total_price'             => $totalPrice,
                    'remarks'                 => $faker->sentence(12),
                    'inspection_committee_id' => $faker->randomElement($inspectionCommitteeIds),
                    'date_received'           => $faker->dateTimeBetween('-1 years', 'now')->format('Y-m-d'),
                    'created_at'              => now(),
                    'updated_at'              => now(),
                ];
            }

            // Insert batch every 500 records
            if (count($iars) >= 500) {
                DB::table('tbl_iar')->insert($iars);
                $iars = [];
            }
        }

        // Insert any remaining records
        if (!empty($iars)) {
            DB::table('tbl_iar')->insert($iars);
        }
    }
}
