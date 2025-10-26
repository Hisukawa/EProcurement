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
        Schema::create('tbl_purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('focal_person_user')->constrained('users')->restrictOnDelete();
            $table->string('pr_number', 15);
            $table->text('purpose')->nullable();
            $table->foreignId('division_id')->constrained('tbl_divisions')->restrictOnDelete();
            $table->string('requested_by');
            $table->enum('status', ['Reviewed', 'Rejected', 'Pending'])->default('Pending');
            $table->boolean('is_sent')->default(false);
            $table->text('send_back_reason')->nullable();
            $table->decimal('total_price', 12, 2)->nullable();
            $table->string('approval_image', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_requests');
    }
};
