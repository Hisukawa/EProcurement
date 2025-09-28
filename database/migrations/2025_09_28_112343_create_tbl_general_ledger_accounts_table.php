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
        Schema::create('tbl_general_ledger_accounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ppe_id'); // FK to PPE
            $table->string('name');   // e.g., Office, ICT Equipment
            $table->string('code');   // e.g., 10, 30
            $table->timestamps();

            $table->foreign('ppe_id')
                ->references('id')
                ->on('tbl_ppe_sub_major_accounts')
                ->onDelete('cascade');
        });


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_general_ledger_accounts');
    }
};
