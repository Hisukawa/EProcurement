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
        // Create Disposal Events Table (for tracking disposal events)
        Schema::create('tbl_disposal', function (Blueprint $table) {
            $table->id();
            $table->string('rrsp_number')->unique();
            $table->string('ics_number')->nullable(); // Who disposed
            $table->date('date_disposed')->nullable();
            $table->timestamps();
        });

        // Create Disposed Items Table (for tracking the items within a disposal event)
        Schema::create('tbl_disposed_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disposal_id')->constrained('tbl_disposal')->onDelete('cascade'); // Link to disposal event
            $table->foreignId('inventory_item_id')->constrained('tbl_inventory')->onDelete('cascade'); // The item being disposed
            $table->string('returned_by'); // Who returned the item
            $table->foreignId('disposed_by')->constrained('users')->restrictOnDelete();
            $table->decimal('quantity', 12, 2); // Quantity of the item
            $table->text('remarks')->nullable(); // Any remarks specific to the item
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_disposed_items');
        Schema::dropIfExists('tbl_disposal');
    }
};
