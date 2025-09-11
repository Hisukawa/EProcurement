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
        Schema::create('tbl_pr_details', function (Blueprint $table) {
            $table->id();

            // Foreign key to purchase request
            $table->foreignId('pr_id')
                  ->constrained('tbl_purchase_requests')
                  ->restrictOnDelete();

            // Foreign key to products
            $table->foreignId('product_id')
                  ->constrained('tbl_products')
                  ->restrictOnDelete();

            // Static data snapshot (optional but recommended)
            $table->string('item');
            $table->text('specs')->nullable();
            $table->string('unit')->nullable(); // e.g., 'pcs', 'box'

            // Quantity and price
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_item_price', 12, 2)->nullable(); // Optional: can be filled during creation

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_pr_details');
    }
};
