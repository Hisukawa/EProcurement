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
        Schema::create('tbl_rfq_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained('tbl_rfqs')->restrictOnDelete();
            $table->foreignId('pr_details_id')->constrained('tbl_pr_details')->restrictOnDelete();
            $table->decimal('quoted_price', 10, 2)->nullable();
            $table->foreignId('supplier_id')->constrained('tbl_suppliers')->restrictOnDelete();
            $table->boolean('is_winner')->default(0);
            $table->text('remarks')->nullable();
 $table->unsignedBigInteger('committee_id')->nullable();
    $table->foreign('committee_id')->references('id')->on('tbl_bac_committees')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_rfq_details');
    }
};
