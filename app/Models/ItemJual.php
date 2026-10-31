<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemJual extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_jual';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'penjualan_id',
        'produk_id',
        'satuan_produk_id',
        'nama_snapshot',
        'satuan_snapshot',
        'qty',
        'harga_snapshot_rp',
        'diskon_rp',
        'total_rp',
        'hpp_rp',
    ];

    protected $casts = [
        'qty' => 'string',
        'harga_snapshot_rp' => 'string',
        'diskon_rp' => 'string',
        'total_rp' => 'string',
        'hpp_rp' => 'string',
    ];

    public function penjualan(): BelongsTo
    {
        return $this->belongsTo(Penjualan::class, 'penjualan_id');
    }

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function satuanProduk(): BelongsTo
    {
        return $this->belongsTo(SatuanProduk::class, 'satuan_produk_id');
    }

    public function alokasiLot(): HasMany
    {
        return $this->hasMany(AlokasiJualLot::class, 'item_jual_id');
    }
}

