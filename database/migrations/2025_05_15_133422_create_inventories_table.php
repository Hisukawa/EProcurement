<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_inventory', function (Blueprint $table) {
            $table->id();
            $table->string('dr_number', 20)->nullable();
            $table->date('dr_date')->nullable();
            $table->integer('iar_id')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('po_detail_id')->nullable()->constrained('tbl_po_details')->onDelete('cascade');
            $table->text('item_desc');
            $table->decimal('total_stock', 10, 2);
            $table->decimal('issued_qty', 10, 2)->default(0); // ✅ new column
            $table->foreignId('unit_id')->constrained('tbl_units')->restrictOnDelete();
            $table->decimal('unit_cost', 10, 2);
            $table->date('last_received')->nullable();
            $table->enum('status', ['Available', 'Issued'])->default('Available');
            $table->enum('source_type', ['po', 'central'])->default('po')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_inventory');
    }
};
