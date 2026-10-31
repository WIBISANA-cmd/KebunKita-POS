<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LotStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'lot_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'produk_id',
        'lokasi_stok_id',
        'item_terima_id',
        'kode_lot',
        'qty_awal',
        'qty_sisa',
        'hpp_dasar',
        'kedaluwarsa_pada',
    ];

    protected $casts = [
        'qty_awal' => 'string',
        'qty_sisa' => 'string',
        'hpp_dasar' => 'string',
        'kedaluwarsa_pada' => 'datetime',
    ];

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(LokasiStok::class, 'lokasi_stok_id');
    }

    public function itemTerima(): BelongsTo
    {
        return $this->belongsTo(ItemTerima::class, 'item_terima_id');
    }

    public function mutasi(): HasMany
    {
        return $this->hasMany(MutasiStok::class, 'lot_stok_id');
    }
}

