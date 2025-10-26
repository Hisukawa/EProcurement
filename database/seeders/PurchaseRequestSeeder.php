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
        $productIds = DB::table('tbl_products')->pluck('id')->toArray(); // Get product IDs

        // Create 20 purchase requests
        for ($i = 0; $i < 1000; $i++) {
            // Insert each purchase request
            $purchaseRequest = [
                'focal_person_user' => $userIds[array_rand($userIds)],  // Real user ID
                'pr_number' => '25-10-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),  // PR number format
                'purpose' => 'Purchase of office supplies',  // Realistic purpose of request
                'division_id' => $divisionIds[array_rand($divisionIds)],  // Real division ID
                'requested_by' => 'Mary Ann M. Beltran',  // Real requester name
                'status' => 'Reviewed',
                'is_sent' => true,
                'send_back_reason' => 'Modify the specifications of the items',
                'total_price' => 0,  // Placeholder, will update later
            ];

            // Insert into tbl_purchase_requests and get inserted PR ID
            $prId = DB::table('tbl_purchase_requests')->insertGetId($purchaseRequest);

            // Realistic purchase request details (at least 2 items per PR)
            $prDetails = [
                [
                    'pr_id' => $prId,
                    'product_id' => $productIds[array_rand($productIds)],  // Real product ID
                    'item' => 'Dell Laptop',  // Real product item
                    'specs' => 'Intel Core i7, 16GB RAM, 512GB SSD',  // Actual specs
                    'unit' => 'pcs',  // Actual unit (e.g., pcs, box)
                    'quantity' => 10,  // Actual quantity
                    'unit_price' => 45000.00,  // Actual unit price
                    'total_item_price' => 45000.00 * 10,  // Calculating total item price
                ],
                [
                    'pr_id' => $prId,
                    'product_id' => $productIds[array_rand($productIds)],  // Real product ID
                    'item' => 'Office Chairs',  // Real product item
                    'specs' => 'Ergonomic, Adjustable, Black',  // Actual specs
                    'unit' => 'pcs',  // Unit type
                    'quantity' => 20,  // Quantity of office chairs
                    'unit_price' => 3000.00,  // Unit price
                    'total_item_price' => 3000.00 * 20,  // Calculating total item price
                ]
            ];

            // Add a third or more items for some requests if needed (optional)
            if ($faker->boolean(50)) {  // 50% chance to add a third item
                $prDetails[] = [
                    'pr_id' => $prId,
                    'product_id' => $productIds[array_rand($productIds)],  // Random product
                    'item' => 'Photocopier Machine',
                    'specs' => 'Multifunction copier, 60ppm, network-enabled',
                    'unit' => 'pcs',
                    'quantity' => 1,
                    'unit_price' => 75000.00,
                    'total_item_price' => 75000.00,
                ];
            }

            // Insert product details into tbl_pr_details
            DB::table('tbl_pr_details')->insert($prDetails);

            // Calculate the total price for the purchase request and update the `tbl_purchase_requests` table
            $totalPrice = DB::table('tbl_pr_details')
                            ->where('pr_id', $prId)
                            ->sum('total_item_price');  // Sum the `total_item_price` for this PR ID

            // Update the `total_price` in the `tbl_purchase_requests` table
            DB::table('tbl_purchase_requests')
                ->where('id', $prId)
                ->update(['total_price' => $totalPrice]);
        }
    }
}
