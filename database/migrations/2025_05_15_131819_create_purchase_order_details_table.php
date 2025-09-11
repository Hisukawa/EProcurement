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
        Schema::create('tbl_po_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('tbl_purchase_orders')->restrictOnDelete();
            $table->foreignId('pr_detail_id')->constrained('tbl_pr_details')->restrictOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_po_details');
    }
};
