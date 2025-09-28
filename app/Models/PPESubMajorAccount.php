<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PPESubMajorAccount extends Model
{
    protected $table = 'tbl_ppe_sub_major_accounts';
    protected $fillable = [
        'name',
        'code',
    ];
    public function generalLedgerAccounts()
    {
        return $this->hasMany(GeneralLedgerAccount::class, 'ppe_id');
    }

}
