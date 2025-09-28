<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationOfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            ['name' => 'CID', 'code' => '01'],
            ['name' => 'SGOD', 'code' => '02'],
            ['name' => 'SDS', 'code' => '03'],
            ['name' => 'ASDS', 'code' => '04'],
            ['name' => 'SDS Quarter', 'code' => '05'],
            ['name' => 'ASDS Quarter', 'code' => '06'],
            ['name' => 'Accounting', 'code' => '07'],
            ['name' => 'Budget', 'code' => '08'],
            ['name' => 'Records', 'code' => '09'],
            ['name' => 'Cash', 'code' => '10'],
            ['name' => 'Supply', 'code' => '11'],
            ['name' => 'Personnel', 'code' => '12'],
            ['name' => 'Admin', 'code' => '13'],
            ['name' => 'Legal', 'code' => '14'],
            ['name' => 'Engr', 'code' => '15'],
            ['name' => 'ICT', 'code' => '16'],
            ['name' => 'TH', 'code' => '17'],
            ['name' => 'LR', 'code' => '18'],
            ['name' => 'Storage Supply', 'code' => '19'],
            ['name' => 'Storage Actg', 'code' => '20'],
            ['name' => 'Storage SGOD', 'code' => '21'],
            ['name' => 'Guard', 'code' => '22'],
            ['name' => 'Board Room', 'code' => '23'],
            ['name' => 'Webinar Room', 'code' => '24'],
            ['name' => 'BAC Office', 'code' => '25'],
            ['name' => 'Server Room', 'code' => '26'],
            ['name' => 'Lobby', 'code' => '27'],
            ['name' => 'Others', 'code' => '28'],
            ['name' => 'Schools', 'code' => '29'],
            ['name' => 'COA', 'code' => '30'],
            ['name' => 'ALS', 'code' => '31'],
            ['name' => 'Office of the Principal', 'code' => '32'],
            ['name' => 'Office of the Assistant Principal', 'code' => '33'],
            ['name' => 'Property Custodian', 'code' => '34'],
            ['name' => 'Library', 'code' => '34'],
            ['name' => 'Clinic', 'code' => '36'],
            ['name' => 'H.E', 'code' => '35'],
            ['name' => 'ICT Room', 'code' => '35'],
            ['name' => 'Faculty Room', 'code' => '36'],
            ['name' => 'N/A', 'code' => '47'],

        ];

        DB::table('tbl_location_offices')->insert($locations);
    }
}
