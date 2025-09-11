<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_bac_committees', function (Blueprint $table) {
            $table->id();
            $table->string('committee_status');
            $table->timestamps();
        });

        Schema::create('tbl_bac_committee_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('committee_id')->constrained('tbl_bac_committees')->onDelete('cascade');
            $table->string('position');
            $table->string('name')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_bac_committees');
        Schema::dropIfExists('tbl_bac_committee_members');
    }
};
