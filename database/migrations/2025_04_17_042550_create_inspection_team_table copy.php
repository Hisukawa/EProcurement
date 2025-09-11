<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_inspection_committees', function (Blueprint $table) {
            $table->id();
            $table->string('inspection_committee_status')->default('active');
            $table->timestamps();
        });

        Schema::create('tbl_inspection_committee_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_committee_id')->constrained('tbl_inspection_committees')->onDelete('cascade');
            $table->string('position');
            $table->string('name')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_inspection_committees');
        Schema::dropIfExists('tbl_inspection_committee_members');
    }
};
