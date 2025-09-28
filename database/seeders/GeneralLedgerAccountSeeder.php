<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GeneralLedgerAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $generalLedgerAccounts = [
            ['name' => 'Land', 'code' => '10', 'ppe_id' => 1],
            ['name' => 'Office', 'code' => '10', 'ppe_id' => 2],
            ['name' => 'School', 'code' => '20', 'ppe_id' => 2],
            ['name' => 'Other', 'code' => '90', 'ppe_id' => 2],
            ['name' => 'Motor Vehicles', 'code' => '10', 'ppe_id' => 3],
            ['name' => 'Other PPE', 'code' => '', 'ppe_id' => 4],
            ['name' => 'Furniture and Fixtures', 'code' => '10', 'ppe_id' => 5],
            ['name' => 'Books', 'code' => '20', 'ppe_id' => 5],
            ['name' => 'Machinery', 'code' => '10', 'ppe_id' => 6],
            ['name' => 'Office Equipment', 'code' => '20', 'ppe_id' => 6],
            ['name' => 'ICT Equipment', 'code' => '30', 'ppe_id' => 6],
            ['name' => 'Disaster Response and Rescue Equipment', 'code' => '90', 'ppe_id' => 6],
            ['name' => 'Medical Equipment', 'code' => '10', 'ppe_id' => 7],
            ['name' => 'Printing Equipment', 'code' => '20', 'ppe_id' => 7],
            ['name' => 'Sports Equipment', 'code' => '30', 'ppe_id' => 7],
            ['name' => 'Technical and Scientific Equipment', 'code' => '40', 'ppe_id' => 7],
            ['name' => 'Machinery Equipment', 'code' => '90', 'ppe_id' => 7],
        ];
        DB::table('tbl_general_ledger_accounts')->insert($generalLedgerAccounts);
    }
}
