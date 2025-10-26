<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $requesterRole = Role::firstOrCreate(['name' => 'requester']);
        $bacApproverRole = Role::firstOrCreate(['name' => 'bac_user']);
        $supplyOfficerRole = Role::firstOrCreate(['name' => 'supply_officer']);
        $twgUserRole = Role::firstOrCreate(['name' => 'twg_user']);

        // Admin
        $admin = User::create([
            'firstname' => 'System',
            'lastname' => 'Administrator',
            'middlename' => '',
            'email' => 'admin@email.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        $admin->assignRole($adminRole);

        // Requesters (with division_id)
        $requesters = [
            [
                'firstname' => 'Juan',
                'lastname' => 'Dela Cruz',
                'middlename' => 'M.',
                'email' => 'juan.delacruz@email.com',
                'position' => 'Supply Officer',
                'division_id' => 1,
            ],
            [
                'firstname' => 'Ana',
                'lastname' => 'Reyes',
                'middlename' => 'S.',
                'email' => 'ana.reyes@email.com',
                'position' => 'Procurement Staff',
                'division_id' => 2,
            ],
            [
                'firstname' => 'Carlos',
                'lastname' => 'Tan',
                'middlename' => 'G.',
                'email' => 'carlos.tan@email.com',
                'position' => 'Division Clerk',
                'division_id' => 3,
            ],
        ];

        foreach ($requesters as $data) {
            $user = User::create(array_merge($data, [
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]));
            $user->assignRole($requesterRole);
        }

        // BAC Approver
        $bac = User::create([
            'firstname' => 'Maria',
            'lastname' => 'Santos',
            'middlename' => 'L.',
            'email' => 'maria.santos@email.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        $bac->assignRole($bacApproverRole);

        // Supply Officer
        $supply = User::create([
            'firstname' => 'Pedro',
            'lastname' => 'Lopez',
            'middlename' => 'C.',
            'email' => 'pedro.lopez@email.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        $supply->assignRole($supplyOfficerRole);

        // TWG User
        $twg = User::create([
            'firstname' => 'Lucia',
            'lastname' => 'Garcia',
            'middlename' => 'R.',
            'email' => 'lucia.garcia@email.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        $twg->assignRole($twgUserRole);
    }
}
