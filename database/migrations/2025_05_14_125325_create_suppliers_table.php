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
        Schema::create('tbl_suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255);
            $table->string('address', 255);
            $table->string('tin_num', 100);
            $table->string('representative_name', 100);
                $table->foreignId('category_id')
                ->nullable()
                ->constrained('tbl_supply_categories')
                ->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_suppliers');
    }
};
