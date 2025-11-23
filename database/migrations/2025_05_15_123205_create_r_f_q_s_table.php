<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_rfqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('pr_id')->nullable()->constrained('tbl_purchase_requests')->restrictOnDelete();
            $table->boolean('grouped')->nullable()->default(true);
            $table->enum('award_mode', ['whole-pr', 'per-item'])->nullable();
            $table->decimal('total_price_calculated', 12, 2)->nullable();
            $table->enum('mode', ['as-read', 'as-calculated'])->nullable()->default('as-read');
            $table->text('project_no')->nullable();
            $table->date('date_of_opening')->nullable();
            $table->string('venue')->nullable();
            $table->string('bac_cn')->nullable();
            $table->string('services')->nullable();
            $table->string('location')->nullable();
            $table->string('subject')->nullable();
            $table->string('delivery_period')->nullable();
            $table->string('abc')->nullable();
            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_rfq_supplier_totals');
        Schema::dropIfExists('tbl_rfqs');
    }
};

