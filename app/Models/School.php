<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $table = 'tbl_schools';
    protected $fillable = [
        'school_name',
        'cluster',
        'school_code',
        'district',
    ];
}
