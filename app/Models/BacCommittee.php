<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BacCommittee extends Model
{
    use HasFactory;
    protected $table = 'tbl_bac_committees';
    protected $fillable = [
        'created_by',
        'status', // overall committee status
    ];

    /**
     * Get all members of this committee version
     */
    public function members()
    {
        return $this->hasMany(BacCommitteeMember::class, 'committee_id');
    }
    

}
