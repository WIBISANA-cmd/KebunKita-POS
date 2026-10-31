<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MetodeBayar extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'metode_bayar';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode',
        'nama',
        'jenis',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    public function bayarJual(): HasMany
    {
        return $this->hasMany(BayarJual::class, 'metode_bayar_id');
    }
}

