<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Division::create([
            'id' => 1,
            'division' => 'SGOD',
            'meaning' => 'School Governance and Operations Division'
        ]);
        Division::create([
            'id' => 2,
            'division' => 'OSDS',
            'meaning' => 'Office of the Schools Division Superintendent'
        ]);
        Division::create([
            'id' => 3,
            'division' => 'CID',
            'meaning' => 'Curriculum Implementation Division'
        ]);
    }
}
