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
            ['position' => 'secretariat', 'name' => 'John Doe', 'status' => 'active'],
            ['position' => 'member1', 'name' => 'Jane Smith', 'status' => 'active'],
            ['position' => 'member2', 'name' => 'Alice Johnson', 'status' => 'active'],
            ['position' => 'member3', 'name' => 'Bob Brown', 'status' => 'active'],
            ['position' => 'vice_chair', 'name' => 'Michael Lee', 'status' => 'active'],
            ['position' => 'chair', 'name' => 'Sarah White', 'status' => 'active'],
        ];

        // Save members
        foreach ($members as $member) {
            $committee->members()->create($member);
        }
    }
}
