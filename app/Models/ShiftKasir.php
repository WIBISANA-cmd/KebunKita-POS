<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShiftKasir extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'shift_kasir';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'pengguna_id',
        'waktu_buka',
        'waktu_tutup',
        'modal_awal_rp',
        'saldo_sistem_rp',
        'saldo_fisik_rp',
        'selisih_rp',
        'catatan_selisih',
        'status',
    ];

    protected $casts = [
        'waktu_buka' => 'datetime',
        'waktu_tutup' => 'datetime',
        'modal_awal_rp' => 'string',
        'saldo_sistem_rp' => 'string',
        'saldo_fisik_rp' => 'string',
        'selisih_rp' => 'string',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'pengguna_id');
    }

    public function penjualan(): HasMany
    {
        return $this->hasMany(Penjualan::class, 'shift_kasir_id');
    }

    public function mutasiKas(): HasMany
    {
        return $this->hasMany(MutasiKas::class, 'shift_kasir_id');
    }
}

