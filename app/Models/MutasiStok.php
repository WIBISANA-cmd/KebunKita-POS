<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutasiStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'mutasi_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'dokumen_stok_id',
        'produk_id',
        'lokasi_stok_id',
        'lot_stok_id',
        'qty_delta',
        'nilai_hpp_rp',
        'keterangan',
    ];

    protected $casts = [
        'qty_delta' => 'string',
        'nilai_hpp_rp' => 'string',
    ];

    public function dokumen(): BelongsTo
    {
        return $this->belongsTo(DokumenStok::class, 'dokumen_stok_id');
    }

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(LokasiStok::class, 'lokasi_stok_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(LotStok::class, 'lot_stok_id');
    }
}

