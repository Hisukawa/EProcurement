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
        // RIS Header
        Schema::create('tbl_ris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('tbl_purchase_orders')->onDelete('cascade');
            $table->string('ris_number')->unique();
            $table->foreignId('requested_by')->nullable()->constrained('users');
            $table->foreignId('issued_by')->constrained('users');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // RIS Items (details)
        Schema::create('tbl_ris_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ris_id')->constrained('tbl_ris')->onDelete('cascade');
            $table->foreignId('inventory_item_id')->constrained('tbl_inventory')->onDelete('cascade');
            $table->enum('switch_type', ['ris', 'ics', 'par'])->nullable();
            $table->foreignId('switched_by')->nullable()->constrained('users');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('total_cost', 14, 2);
            $table->integer('quantity');
            $table->enum('status', ['reissued', 'disposed'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_ris_items');
        Schema::dropIfExists('tbl_ris');
    }
};
