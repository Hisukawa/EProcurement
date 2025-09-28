<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralLedgerAccount extends Model
{
    protected $table = 'tbl_general_ledger_accounts';
    protected $fillable = [
        'ppe_id',
        'name',
        'code',
    ];
    public function ppeSubMajorAccount()
    {
        return $this->belongsTo(PPESubMajorAccount::class, 'ppe_id');
    }

}
