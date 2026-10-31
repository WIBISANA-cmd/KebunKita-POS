<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransferStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'transfer_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_asal_id',
        'cabang_tujuan_id',
        'pengirim_id',
        'penerima_id',
        'nomor',
        'waktu_kirim',
        'waktu_terima',
        'status',
        'catatan',
    ];

    protected $casts = [
        'waktu_kirim' => 'datetime',
        'waktu_terima' => 'datetime',
    ];

    public function cabangAsal(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_asal_id');
    }

    public function cabangTujuan(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_tujuan_id');
    }

    public function pengirim(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'pengirim_id');
    }

    public function penerima(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'penerima_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemTransfer::class, 'transfer_stok_id');
    }
}

