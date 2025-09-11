<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InspectionCommitteeSeeder extends Seeder
{
    public function run(): void
    {
        $committees = [
            [
                'status' => 'active',
                'members' => [
                    ['position' => 'Leader', 'name' => 'Kenski Quiling', 'status' => 'active'],
                    ['position' => 'Member', 'name' => 'Harold Agriam', 'status' => 'active'],
                    ['position' => 'Member', 'name' => 'Jose Ramirez', 'status' => 'inactive'],
                ],
            ]
        ];

        foreach ($committees as $committee) {
            $committeeId = DB::table('tbl_inspection_committees')->insertGetId([
                'inspection_committee_status' => $committee['status'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($committee['members'] as $member) {
                DB::table('tbl_inspection_committee_members')->insert([
                    'inspection_committee_id' => $committeeId,
                    'position' => $member['position'],
                    'name' => $member['name'],
                    'status' => $member['status'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
