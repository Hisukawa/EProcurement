<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name' => 'Printer A',
                'specs' => 'Laser printer, 1200dpi, USB/Wi-Fi',
                'unit_id' => 1,
                'default_price' => 7500.00,
            ],
            [
                'name' => 'Monitor B',
                'specs' => '27" LED, 1920x1080, HDMI',
                'unit_id' => 1,
                'default_price' => 4500.00,
            ],
            [
                'name' => 'Keyboard C',
                'specs' => 'Mechanical, RGB backlight, USB',
                'unit_id' => 1,
                'default_price' => 1500.00,
            ],
            [
                'name' => 'Bond Paper A4',
                'specs' => '80gsm, White, 500 sheets per ream',
                'unit_id' => 8, 
                'default_price' => 250.00,
            ],
            [
                'name' => 'Bond Paper Legal',
                'specs' => '80gsm, White, 500 sheets per ream',
                'unit_id' => 8,
                'default_price' => 280.00,
            ],
            [
                'name' => 'Colored Bond Paper',
                'specs' => '70gsm, Assorted colors, 100 sheets per pack',
                'unit_id' => 7,
                'default_price' => 150.00,
            ],
            [
                'name' => 'High-End Server',
                'specs' => 'Rack-mounted, 128GB RAM, 2TB SSD, Dual Xeon CPUs',
                'unit_id' => 1,
                'default_price' => 250000.00,
            ],
            [
                'name' => 'Photocopier Machine',
                'specs' => 'Multifunction copier, 60ppm, network-enabled',
                'unit_id' => 1,
                'default_price' => 75000.00,
            ],
            [
                'name' => 'Conference Table',
                'specs' => 'Solid wood, 12-seater, with cable management',
                'unit_id' => 1,
                'default_price' => 55000.00,
            ],
            [
                'name' => 'Projector System',
                'specs' => '4K UHD, 5000 lumens, ceiling mount',
                'unit_id' => 1,
                'default_price' => 60000.00,
            ],
            [
                'name' => 'Executive Office Desk',
                'specs' => 'L-shaped, mahogany wood with drawers',
                'unit_id' => 1,
                'default_price' => 52000.00,
            ],
            [
                'name' => 'Ballpoint Pen',
                'specs' => 'Blue ink, pack of 10',
                'unit_id' => 7,
                'default_price' => 120.00,
            ],
            [
                'name' => 'Whiteboard Marker',
                'specs' => 'Assorted colors, pack of 12',
                'unit_id' => 7,
                'default_price' => 180.00,
            ],
            [
                'name' => 'Stapler',
                'specs' => 'Heavy duty, standard size',
                'unit_id' => 1,
                'default_price' => 300.00,
            ],
            [
                'name' => 'External Hard Drive',
                'specs' => '2TB, USB 3.0',
                'unit_id' => 1,
                'default_price' => 4000.00,
            ],
            [
                'name' => 'UPS System',
                'specs' => '1500VA, 900W, battery backup',
                'unit_id' => 1,
                'default_price' => 8000.00,
            ],
            [
                'name' => 'Laser Pointer',
                'specs' => 'Red laser, portable, battery-powered',
                'unit_id' => 1,
                'default_price' => 500.00,
            ],
            [
                'name' => 'Office Chair',
                'specs' => 'Ergonomic, adjustable height, swivel',
                'unit_id' => 1,
                'default_price' => 12000.00,
            ],
            [
                'name' => 'Water Dispenser',
                'specs' => 'Hot & cold, 18L bottle capacity',
                'unit_id' => 1,
                'default_price' => 7000.00,
            ],
        ];

        // Add timestamps
        $products = array_map(function($product){
            $product['created_at'] = now();
            $product['updated_at'] = now();
            return $product;
        }, $products);

        DB::table('tbl_products')->insert($products);
    }
}
