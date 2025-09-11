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
        Schema::create('tbl_ris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('tbl_inventory')->onDelete('cascade');
            $table->foreignId('po_id')->constrained('tbl_purchase_orders')->onDelete('cascade');
            $table->string('ris_number')->unique();
            $table->foreignId('issued_to')->constrained('users');
            $table->foreignId('issued_by')->constrained('users');
            $table->integer('quantity');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_ris');
    }
};
