<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reissued extends Model
{
    protected $table = 'tbl_reissued';
    protected $fillable = [
        'rrsp_number',
        'ics_number',
        'date_reissued',
        'remarks',
    ];

    public function items()
    {
        return $this->hasMany(ReissuedItems::class, 'reissued_id');
    }
}
