<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use phpDocumentor\Reflection\Location;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run all your seeders in proper order (respecting foreign keys)
        $this->call([
            // Master data first
            PPESubMajorAccountSeeder::class,
            GeneralLedgerAccountSeeder::class,
            LocationOfficeSeeder::class,
            SchoolsSeeder::class,
            UnitSeeder::class,
            SupplierSeeder::class,
            ProductSeeder::class,
            DivisionSeeder::class,  // if you have tbl_divisions
            UserSeeder::class,
            RequestingSeeder::class,
            RoleSeeder::class,
            BacCommitteeSeeder::class,
            InspectionCommitteeSeeder::class,
            

            // PurchaseRequestSeeder::class,
            // PrDetailSeeder::class,
            // RfqSeeder::class,
            // RfqDetailSeeder::class,
            // PurchaseOrderSeeder::class,
            // PoDetailSeeder::class,
            // IarSeeder::class,
            // InventorySeeder::class,

            // RisSeeder::class,
            // IcsSeeder::class,
            // ParSeeder::class,

            
            // AuditLogSeeder::class,
        ]);
    }
}
