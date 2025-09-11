<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionCommittee extends Model
{
    protected $table = 'tbl_inspection_committees';
    public function members()
    {
        return $this->hasMany(InspectionCommitteeMember::class, 'inspection_committee_id');
    }

}
