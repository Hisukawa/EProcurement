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
        ]);
        Division::create([
            'id' => 2,
            'division' => 'OSDS',
        ]);
        Division::create([
            'id' => 3,
            'division' => 'CID',
        ]);
    }
}
