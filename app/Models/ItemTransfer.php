<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemTransfer extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_transfer';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'transfer_stok_id',
        'produk_id',
        'satuan_produk_id',
        'qty_kirim',
        'qty_terima',
        'hpp_satuan_rp',
    ];

    protected $casts = [
        'qty_kirim' => 'string',
        'qty_terima' => 'string',
        'hpp_satuan_rp' => 'string',
    ];

    public function transferStok(): BelongsTo
    {
        return $this->belongsTo(TransferStok::class, 'transfer_stok_id');
    }

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function satuanProduk(): BelongsTo
    {
        return $this->belongsTo(SatuanProduk::class, 'satuan_produk_id');
    }
}

