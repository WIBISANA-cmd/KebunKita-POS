<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaldoStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'saldo_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'produk_id',
        'lokasi_stok_id',
        'qty_dasar',
    ];

    protected $casts = [
        'qty_dasar' => 'string',
    ];

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(LokasiStok::class, 'lokasi_stok_id');
    }
}

