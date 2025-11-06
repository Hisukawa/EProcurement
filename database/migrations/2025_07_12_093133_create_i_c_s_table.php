<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ICS Header
        Schema::create('tbl_ics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->nullable()->constrained('tbl_purchase_orders')->onDelete('cascade');
            $table->string('ics_number')->unique();
            $table->foreignId('requested_by')->nullable()->constrained('users');
            $table->foreignId('received_from')->constrained('users');
            
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // ICS Items (Details)
        Schema::create('tbl_ics_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ics_id')->constrained('tbl_ics')->onDelete('cascade');
            $table->string('recipient')->nullable();
            $table->string('recipient_division')->nullable();
            $table->foreignId('inventory_item_id')->constrained('tbl_inventory')->onDelete('cascade');
            $table->decimal('estimated_useful_life', 12, 2);
            $table->string('inventory_item_number')->nullable();
            $table->string('ppe_sub_major_account')->nullable();
            $table->string('general_ledger_account')->nullable();
            $table->string('series_number')->nullable();
            $table->string('office')->nullable();
            $table->string('school')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('total_cost', 14, 2);
            $table->enum('type', ['low', 'high'])->nullable();
            $table->enum('status', ['reissued', 'disposed'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_ics_items');
        Schema::dropIfExists('tbl_ics');
    }
};
