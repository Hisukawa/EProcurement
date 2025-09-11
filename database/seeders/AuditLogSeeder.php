<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $userIds = DB::table('users')->pluck('id')->toArray();

        // Entities that can be audited
        $entities = [
            'PurchaseRequest'   => 'tbl_purchase_requests',
            'PurchaseOrder'     => 'tbl_purchase_orders',
            'Inventory'         => 'tbl_inventory',
            'RIS'               => 'tbl_ris',
            'ICS'               => 'tbl_ics',
            'PAR'               => 'tbl_par',
            'RFQ'               => 'tbl_rfqs',
        ];

        $actions = ['create', 'update', 'delete', 'approve', 'reject', 'qty_adjusted', 'status_changed'];

        $logs = [];

        foreach (range(1, 1000) as $i) {
            // Pick entity type
            $entityType = $faker->randomElement(array_keys($entities));
            $table = $entities[$entityType];

            // Pick a valid entity id if available
            $entityIds = DB::table($table)->pluck('id')->toArray();
            if (empty($entityIds)) continue;

            $entityId = $faker->randomElement($entityIds);

            $action = $faker->randomElement($actions);

            // Random changes JSON
            $changes = null;
            if ($action === 'qty_adjusted') {
                $from = $faker->numberBetween(1, 50);
                $to = $faker->numberBetween(1, 50);
                $changes = json_encode(['qty' => ['from' => $from, 'to' => $to]]);
            } elseif ($action === 'status_changed') {
                $changes = json_encode(['status' => ['from' => 'Pending', 'to' => 'Approved']]);
            } elseif ($action === 'update') {
                $changes = json_encode(['field' => ['from' => 'old value', 'to' => 'new value']]);
            }

            $logs[] = [
                'action'       => $action,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'changes'      => $changes,
                'reason'       => $faker->boolean(60) ? $faker->sentence() : null,
                'user_id'      => $faker->randomElement($userIds),
                'created_at'   => $faker->dateTimeBetween('-1 year', 'now'),
                'updated_at'   => now(),
            ];
        }

        // Insert in chunks for performance
        foreach (array_chunk($logs, 200) as $chunk) {
            DB::table('tbl_audit_logs')->insert($chunk);
        }
    }
}
