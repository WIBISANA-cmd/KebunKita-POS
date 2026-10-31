<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pemasok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pemasok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama',
        'kontak',
        'telepon',
        'alamat',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}

