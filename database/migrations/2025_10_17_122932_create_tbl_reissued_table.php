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
        // Create Reissue Events Table (for tracking reissue events)
        Schema::create('tbl_reissued', function (Blueprint $table) {
            $table->id();
            $table->string('rrsp_number')->unique();
            $table->string('ics_number')->nullable();
            $table->date('date_reissued')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // Create Reissued Items Table (for tracking items in a reissue event)
        Schema::create('tbl_reissued_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reissued_id')->constrained('tbl_reissued')->onDelete('cascade'); // Link to reissue event
            $table->foreignId('inventory_item_id')->constrained('tbl_inventory')->onDelete('cascade'); // The item being reissued
            $table->foreignId('returned_by')->constrained('users')->restrictOnDelete(); // Who returned the item
            $table->foreignId('reissued_by')->constrained('users')->restrictOnDelete(); // Who is reissuing
            $table->decimal('quantity', 12, 2); // Quantity of the item being reissued
            $table->text('remarks')->nullable(); // Any remarks specific to the item
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_reissued_items');
        Schema::dropIfExists('tbl_reissued');
    }
};
