<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionCommitteeMember extends Model
{
    protected $table = 'tbl_inspection_committee_members';
    protected $fillable = [
        'inspection_committee_id',
        'name',
        'position',
        'status', // ✅ add this so you can mass assign status
    ];

}
