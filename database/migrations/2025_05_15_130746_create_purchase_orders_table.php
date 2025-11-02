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
        Schema::create('tbl_purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number', 15);
            $table->foreignId('rfq_id')->constrained('tbl_rfqs')->restrictOnDelete();
            $table->foreignId('supplier_id')->constrained('tbl_suppliers')->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->enum('status', ['Inspected and Delivered', 'Not yet Delivered'])->default('Not yet Delivered');
            $table->string('mode_of_procurement')->nullable();
            $table->string('delivery_term')->nullable();
            $table->string('payment_term')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_orders');
    }
};
