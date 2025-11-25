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
            $table->foreignId('po_id')->nullable()->constrained('tbl_purchase_orders')->restrictOnDelete();
            $table->string('iar_number', 20)->nullable();
            $table->text('specs');
            $table->foreignId('unit_id')->constrained('tbl_units')->restrictOnDelete();
            $table->decimal('quantity_ordered', 10, 2)->nullable();
            $table->decimal('quantity_received', 10, 2)->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('remarks')->nullable();
            $table->foreignId('inspection_committee_id')
                ->nullable()
                ->constrained('tbl_inspection_committees')
                ->onDelete('restrict');
            $table->date('date_received');
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->enum('source_type', ['po', 'central'])->default('po')->nullable();
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
