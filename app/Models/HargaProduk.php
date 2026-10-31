<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HargaProduk extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'harga_produk';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'satuan_produk_id',
        'cabang_id',
        'jenis_harga',
        'harga_rp',
        'mulai_pada',
        'akhir_pada',
    ];

    protected $casts = [
        'harga_rp' => 'string',
        'mulai_pada' => 'datetime',
        'akhir_pada' => 'datetime',
    ];

    public function satuanProduk(): BelongsTo
    {
        return $this->belongsTo(SatuanProduk::class, 'satuan_produk_id');
    }

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }
}

