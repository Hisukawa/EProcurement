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
        Schema::create('tbl_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action'); // "update", "qty_adjusted", "approve"
            $table->string('entity_type'); // e.g., "PurchaseRequest", "PurchaseOrder"
            $table->unsignedBigInteger('entity_id');
            $table->text('changes')->nullable(); // JSON: { qty: {from: 5, to: 4} }
            $table->text('reason')->nullable();  // WHY it was changed
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_audit_logs');
    }
};
