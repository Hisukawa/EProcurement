<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BacCommitteeMember extends Model
{
    use HasFactory;
    protected $table = 'tbl_bac_committee_members';
    protected $fillable = [
        'committee_id',
        'position', // e.g., secretariat, member1, vice_chair, chair
        'name',
        'status', // pending, approved, replaced
    ];

    /**
     * Get the parent committee
     */
    public function committee()
    {
        return $this->belongsTo(BacCommittee::class, 'committee_id');
    }
}
