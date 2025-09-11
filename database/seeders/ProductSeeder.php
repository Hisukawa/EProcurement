<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // $faker = Faker::create();

        // // Ensure we actually have categories, units, supplier categories
        // $categoryIds = DB::table('tbl_categories')->pluck('id')->toArray();
        // $unitIds = DB::table('tbl_units')->pluck('id')->toArray();
        // $supplierCategoryIds = DB::table('tbl_supplier_categories')->pluck('id')->toArray();

        // if (empty($categoryIds) || empty($unitIds)) {
        //     throw new \Exception("Seed tbl_categories and tbl_units before seeding products.");
        // }

        // $products = [];

        // foreach (range(1, 50) as $i) {
        //     $unitCost = $faker->randomFloat(2, 100, 20000);

        //     $products[] = [
        //         'name'                 => $faker->words(3, true),
        //         'specs'                => $faker->sentence(),
        //         'unit_id'              => $faker->randomElement($unitIds),
        //         'category_id'          => $faker->randomElement($categoryIds), // always valid
        //         'supplier_category_id' => !empty($supplierCategoryIds) ? $faker->randomElement($supplierCategoryIds) : null,
        //         'default_price'        => $unitCost,
        //         'created_at'           => now(),
        //         'updated_at'           => now(),
        //     ];
        // }

        // DB::table('tbl_products')->insert($products);
        DB::table('tbl_products')->insert([
            [
                'name' => 'Printer A',
                'specs' => 'Laser printer, 1200dpi, USB/Wi-Fi',
                'unit_id' => 2,
                'category_id' => 2,
                'supply_category_id' => 2, // Assumes '2' is IT Equipment
                'default_price' => 7500.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Monitor B',
                'specs' => '27" LED, 1920x1080, HDMI',
                'unit_id' => 2,
                'category_id' => 2,
                'supply_category_id' => 2, // Assumes '2' is IT Equipment
                'default_price' => 4500.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Keyboard C',
                'specs' => 'Mechanical, RGB backlight, USB',
                'unit_id' => 3,
                'category_id' => 2, // Semi-Expendable
                'supply_category_id' => 2, // Assumes '2' is IT Equipment
                'default_price' => 1500.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bond Paper A4',
                'specs' => '80gsm, White, 500 sheets per ream',
                'unit_id' => 1,
                'category_id' => 1, // Consumable
                'supply_category_id' => 1, // Assumes '1' is Office Supplies
                'default_price' => 250.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bond Paper Legal',
                'specs' => '80gsm, White, 500 sheets per ream',
                'unit_id' => 1,
                'category_id' => 1, // Consumable
                'supply_category_id' => 1, // Assumes '1' is Office Supplies
                'default_price' => 280.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Colored Bond Paper',
                'specs' => '70gsm, Assorted colors, 100 sheets per pack',
                'unit_id' => 1,
                'category_id' => 1, // Consumable
                'supply_category_id' => 1, // Assumes '1' is Office Supplies
                'default_price' => 150.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'High-End Server',
                'specs' => 'Rack-mounted, 128GB RAM, 2TB SSD, Dual Xeon CPUs',
                'unit_id' => 2, // piece
                'category_id' => 3, // Non-Expendable
                'supply_category_id' => 2, // IT Equipment supplier
                'default_price' => 250000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Photocopier Machine',
                'specs' => 'Multifunction copier, 60ppm, network-enabled',
                'unit_id' => 2, // piece
                'category_id' => 3, // Non-Expendable
                'supply_category_id' => 1, // Office Equipment supplier
                'default_price' => 75000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Conference Table',
                'specs' => 'Solid wood, 12-seater, with cable management',
                'unit_id' => 2,
                'category_id' => 3, // Non-Expendable
                'supply_category_id' => 3, // Furniture supplier
                'default_price' => 55000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Projector System',
                'specs' => '4K UHD, 5000 lumens, ceiling mount',
                'unit_id' => 2,
                'category_id' => 3, // Non-Expendable
                'supply_category_id' => 2, // IT Equipment supplier
                'default_price' => 60000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Executive Office Desk',
                'specs' => 'L-shaped, mahogany wood with drawers',
                'unit_id' => 2,
                'category_id' => 3, // Non-Expendable
                'supply_category_id' => 3, // Furniture supplier
                'default_price' => 52000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}