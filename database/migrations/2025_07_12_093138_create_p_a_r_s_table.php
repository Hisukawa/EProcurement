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
        // PAR Header
        Schema::create('tbl_par', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('tbl_purchase_orders')->onDelete('cascade');
            $table->string('par_number')->unique();
            $table->foreignId('requested_by')->nullable()->constrained('users');
            $table->foreignId('issued_by')->constrained('users');
            $table->text('remarks')->nullable();
            $table->date('date_acquired')->nullable();
            $table->timestamps();
        });

        // PAR Items (Details)
        Schema::create('tbl_par_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('par_id')->constrained('tbl_par')->onDelete('cascade');
            $table->foreignId('inventory_item_id')->constrained('tbl_inventory')->onDelete('cascade');
            $table->decimal('estimated_useful_life', 12, 2);
            $table->string('inventory_item_number')->nullable();
            $table->string('ppe_sub_major_account')->nullable();
            $table->string('general_ledger_account')->nullable();
            $table->string('series_number')->nullable();
            $table->string('office')->nullable();
            $table->string('school')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('total_cost', 14, 2);
            $table->string('property_no')->nullable();
            $table->enum('status', ['reissued', 'disposed'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_par_items');
        Schema::dropIfExists('tbl_par');
    }
};
