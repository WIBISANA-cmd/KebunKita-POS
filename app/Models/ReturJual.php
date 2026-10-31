<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReturJual extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'retur_jual';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'penjualan_id',
        'shift_kasir_id',
        'pengguna_id',
        'nomor',
        'waktu_retur',
        'status',
        'total_refund_rp',
        'alasan',
    ];

    protected $casts = [
        'waktu_retur' => 'datetime',
        'total_refund_rp' => 'string',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function penjualan(): BelongsTo
    {
        return $this->belongsTo(Penjualan::class, 'penjualan_id');
    }

    public function shiftKasir(): BelongsTo
    {
        return $this->belongsTo(ShiftKasir::class, 'shift_kasir_id');
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'pengguna_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemRetur::class, 'retur_jual_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(RefundBayar::class, 'retur_jual_id');
    }
}

