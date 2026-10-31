<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemBeli extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_beli';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pesanan_beli_id',
        'produk_id',
        'satuan_produk_id',
        'qty',
        'harga_rp',
        'subtotal_rp',
        'qty_diterima',
    ];

    protected $casts = [
        'qty' => 'string',
        'harga_rp' => 'string',
        'subtotal_rp' => 'string',
        'qty_diterima' => 'string',
    ];

    public function pesananBeli(): BelongsTo
    {
        return $this->belongsTo(PesananBeli::class, 'pesanan_beli_id');
    }

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function satuanProduk(): BelongsTo
    {
        return $this->belongsTo(SatuanProduk::class, 'satuan_produk_id');
    }

    public function itemTerima(): HasMany
    {
        return $this->hasMany(ItemTerima::class, 'item_beli_id');
    }
}

