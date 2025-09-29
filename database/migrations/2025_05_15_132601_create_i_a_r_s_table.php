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
        Schema::create('tbl_iar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('tbl_purchase_orders')->restrictOnDelete();
            $table->string('iar_number', 20);
            $table->string('specs', 255);
            $table->foreignId('unit')->constrained('tbl_units')->restrictOnDelete();
            $table->decimal('quantity_ordered', 10, 2);
            $table->decimal('quantity_received', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('remarks');
            $table->foreignId('inspection_committee_id')
                ->constrained('tbl_inspection_committees')
                ->onDelete('restrict');
            $table->date('date_received');
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_iar');
    }
};
