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
        Schema::create('tbl_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('po_id')->constrained('tbl_purchase_orders')->onDelete('cascade');
            $table->string('item_desc', 255);
            $table->decimal('total_stock', 10, 2);
            $table->foreignId('unit_id')->constrained('tbl_units')->restrictOnDelete();
            $table->decimal('unit_cost', 10, 2);
            $table->date('last_received')->nullable();
            $table->enum('status', ['Available', 'Issued'])->default('Available');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_inventory');
    }
};
