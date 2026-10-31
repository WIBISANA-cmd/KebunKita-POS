<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pelanggan';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama',
        'telepon',
        'email',
        'alamat',
        'poin',
        'aktif',
    ];

    protected $casts = [
        'poin' => 'integer',
        'aktif' => 'boolean',
    ];
}

