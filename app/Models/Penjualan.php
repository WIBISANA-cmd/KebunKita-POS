<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Penjualan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'penjualan';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'shift_kasir_id',
        'pelanggan_id',
        'nomor',
        'waktu_penjualan',
        'status',
        'tipe_pesanan',
        'subtotal_rp',
        'diskon_rp',
        'pajak_rp',
        'total_rp',
        'hpp_total_rp',
        'idempotency_key',
        'catatan',
    ];

    protected $casts = [
        'waktu_penjualan' => 'datetime',
        'subtotal_rp' => 'string',
        'diskon_rp' => 'string',
        'pajak_rp' => 'string',
        'total_rp' => 'string',
        'hpp_total_rp' => 'string',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function shiftKasir(): BelongsTo
    {
        return $this->belongsTo(ShiftKasir::class, 'shift_kasir_id');
    }

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(Pelanggan::class, 'pelanggan_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemJual::class, 'penjualan_id');
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(BayarJual::class, 'penjualan_id');
    }
}

