<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LokasiStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'lokasi_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'kode',
        'nama',
        'tipe',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function saldo(): HasMany
    {
        return $this->hasMany(SaldoStok::class, 'lokasi_stok_id');
    }

    public function lot(): HasMany
    {
        return $this->hasMany(LotStok::class, 'lokasi_stok_id');
    }
}

