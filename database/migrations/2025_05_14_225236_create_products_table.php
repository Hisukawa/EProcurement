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
        Schema::create('tbl_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');      
            $table->text('specs')->nullable();
            $table->foreignId('unit_id')  
                    ->constrained('tbl_units')
                    ->onDelete('cascade');
            $table->foreignId('category_id')
                    ->constrained('tbl_categories')
                    ->onDelete('cascade');
            $table->foreignId('supply_category_id')
                    ->nullable()
                    ->constrained('tbl_supply_categories')
                    ->onDelete('set null'); 

            $table->decimal('default_price', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_products');
    }
};
