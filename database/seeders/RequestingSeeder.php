<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RequestingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tbl_requesting_officers')->insert([
            [
                'name' => 'Mary Ann M. Beltran',
                'division_id' => 1
            ],
            [
                'name' => 'John Doe',
                'division_id' => 2
            ],
            [
                'name' => 'Lebron James',
                'division_id' => 3
            ],
            
        ]);
    }
}
