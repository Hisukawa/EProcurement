<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PPESubMajorAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ppeaccounts =[
            ['name'=> 'Land', 'code' => '10'],
            ['name' => 'Building', 'code' => '40'],
            ['name' => 'Transportation', 'code' => '60'],
            ['name' => 'Other PPE', 'code' => '98'],
            ['name' => 'Furniture, Fixture and Books', 'code' => '70'],
            ['name' => 'Machinery', 'code' => '50'],
            ['name' => 'Machinery Equipment', 'code' => '51'],
        ];

        DB::table('tbl_ppe_sub_major_accounts')->insert($ppeaccounts);
    }
}
