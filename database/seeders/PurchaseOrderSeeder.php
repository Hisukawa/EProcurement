<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class PurchaseOrderSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid foreign key IDs
        $rfqIds = DB::table('tbl_rfqs')->pluck('id')->toArray();
        $supplierIds = DB::table('tbl_suppliers')->pluck('id')->toArray();
        $userIds = DB::table('users')->pluck('id')->toArray();

        $purchaseOrders = [];

        foreach ($rfqIds as $rfqId) {
            // Randomly decide if this RFQ will generate a PO (about 70% chance)
            if ($faker->boolean(70)) {
                $purchaseOrders[] = [
                    'po_number'  => strtoupper('PO-' . $faker->unique()->bothify('####-###')), // e.g., PO-2025-123
                    'rfq_id'     => $rfqId,
                    'supplier_id'=> $faker->randomElement($supplierIds),
                    'user_id'    => $faker->randomElement($userIds),
                    'status'     => $faker->randomElement(['Inspected and Delivered', 'Not yet Delivered']),
                    'created_at' => $faker->dateTimeBetween('-1 years', 'now'),
                    'updated_at' => now(),
                ];
            }

            // Insert batch every 500 for performance
            if (count($purchaseOrders) > 500) {
                DB::table('tbl_purchase_orders')->insert($purchaseOrders);
                $purchaseOrders = [];
            }
        }

        // Insert remaining
        if (!empty($purchaseOrders)) {
            DB::table('tbl_purchase_orders')->insert($purchaseOrders);
        }
    }
}
