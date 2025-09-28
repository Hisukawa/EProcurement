<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch existing category IDs
        $categoryIds = DB::table('tbl_supply_categories')->pluck('id')->toArray();

        // Realistic supplier data
        $suppliers = [
            [
                'company_name' => 'Ace Office Supplies',
                'address' => '123 Rizal St., Manila, Philippines',
                'tin_num' => '123-456-789-000',
                'representative_name' => 'Juan Dela Cruz',
            ],
            [
                'company_name' => 'Global Tech Solutions',
                'address' => '45 Ayala Ave., Makati, Philippines',
                'tin_num' => '234-567-890-111',
                'representative_name' => 'Maria Santos',
            ],
            [
                'company_name' => 'Bright Electronics',
                'address' => '678 Diversion Rd., Cebu City, Philippines',
                'tin_num' => '345-678-901-222',
                'representative_name' => 'Pedro Reyes',
            ],
            [
                'company_name' => 'Metro Industrial Supply',
                'address' => '12 Bonifacio Blvd., Davao City, Philippines',
                'tin_num' => '456-789-012-333',
                'representative_name' => 'Angela Cruz',
            ],
            [
                'company_name' => 'Prime Foods Inc.',
                'address' => '88 Quezon Ave., Quezon City, Philippines',
                'tin_num' => '567-890-123-444',
                'representative_name' => 'Luis Mendoza',
            ],
            [
                'company_name' => 'National Office Systems',
                'address' => '22 Mabini St., Manila, Philippines',
                'tin_num' => '678-901-234-555',
                'representative_name' => 'Catherine Lim',
            ],
            [
                'company_name' => 'Philippine Industrial Co.',
                'address' => '101 Roxas Blvd., Manila, Philippines',
                'tin_num' => '789-012-345-666',
                'representative_name' => 'Mark Villanueva',
            ],
            [
                'company_name' => 'East Asia Supplies',
                'address' => '55 Colon St., Cebu City, Philippines',
                'tin_num' => '890-123-456-777',
                'representative_name' => 'Grace Tan',
            ],
            [
                'company_name' => 'Island Wholesale Traders',
                'address' => '77 Rizal St., Iloilo City, Philippines',
                'tin_num' => '901-234-567-888',
                'representative_name' => 'Fernando Cruz',
            ],
            [
                'company_name' => 'Sunrise Retailers',
                'address' => '33 Mabini St., Davao City, Philippines',
                'tin_num' => '012-345-678-999',
                'representative_name' => 'Isabel Santos',
            ],
            [
                'company_name' => 'Tech Innovations Corp.',
                'address' => '9 Aurora Blvd., Pasig, Philippines',
                'tin_num' => '112-233-445-000',
                'representative_name' => 'Ramon Garcia',
            ],
            [
                'company_name' => 'Golden Hardware Supplies',
                'address' => '120 Mabini St., Manila, Philippines',
                'tin_num' => '223-344-556-111',
                'representative_name' => 'Liza Fernandez',
            ],
            [
                'company_name' => 'Pacific Foods Corp.',
                'address' => '88 J.P. Laurel St., Cebu City, Philippines',
                'tin_num' => '334-455-667-222',
                'representative_name' => 'Carlos Reyes',
            ],
            [
                'company_name' => 'Universal Tech Traders',
                'address' => '14 Bonifacio St., Manila, Philippines',
                'tin_num' => '445-566-778-333',
                'representative_name' => 'Sophia Lim',
            ],
            [
                'company_name' => 'Elite Office Systems',
                'address' => '67 Ayala Ave., Makati, Philippines',
                'tin_num' => '556-677-889-444',
                'representative_name' => 'Antonio Cruz',
            ],
            [
                'company_name' => 'Manila Industrial Supply',
                'address' => '45 Quezon Ave., Quezon City, Philippines',
                'tin_num' => '667-788-990-555',
                'representative_name' => 'Monica Santos',
            ],
            [
                'company_name' => 'Cebu Electronics Co.',
                'address' => '12 Osmena Blvd., Cebu City, Philippines',
                'tin_num' => '778-899-001-666',
                'representative_name' => 'Daniel Villanueva',
            ],
            [
                'company_name' => 'North Star Retailers',
                'address' => '99 Mabini St., Davao City, Philippines',
                'tin_num' => '889-900-112-777',
                'representative_name' => 'Patricia Tan',
            ],
            [
                'company_name' => 'Asia Wholesale Traders',
                'address' => '50 Rizal St., Manila, Philippines',
                'tin_num' => '990-011-223-888',
                'representative_name' => 'Roberto Garcia',
            ],
            [
                'company_name' => 'Innovative Solutions Inc.',
                'address' => '77 Aurora Blvd., Pasig, Philippines',
                'tin_num' => '101-112-131-999',
                'representative_name' => 'Elena Mendoza',
            ],
        ];

        // Add timestamps
        $suppliers = array_map(function($supplier) {
            $supplier['created_at'] = now();
            $supplier['updated_at'] = now();
            return $supplier;
        }, $suppliers);

        DB::table('tbl_suppliers')->insert($suppliers);
    }
}
