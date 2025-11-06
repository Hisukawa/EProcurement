<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BacCommittee;
use App\Models\BacCommitteeMember;

class BacCommitteeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a committee
        $committee = BacCommittee::create([
            'committee_status' => 'active', // overall committee status
        ]);

        // Members for this committee
        $members = [
            ['position' => 'secretariat', 'name' => 'HEIDELYN D. MESA', 'status' => 'active'],
            ['position' => 'member1', 'name' => 'JOSEPH R. UANIA', 'status' => 'active'],
            ['position' => 'member2', 'name' => 'MARY ANN M. BELTRAN', 'status' => 'active'],
            ['position' => 'member3', 'name' => 'SAMUEL P. LAZAMA', 'status' => 'active'],
            ['position' => 'vice_chair', 'name' => 'JULIET V. GUMPAL', 'status' => 'active'],
            ['position' => 'chair', 'name' => 'CHERYL R. RAMIRO', 'status' => 'active'],
        ];

        // Save members
        foreach ($members as $member) {
            $committee->members()->create($member);
        }
    }
}
