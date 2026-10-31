<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemOpname extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_opname';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'opname_stok_id',
        'produk_id',
        'lot_stok_id',
        'qty_sistem',
        'qty_fisik',
        'selisih',
    ];

    protected $casts = [
        'qty_sistem' => 'string',
        'qty_fisik' => 'string',
        'selisih' => 'string',
    ];

    public function opname(): BelongsTo
    {
        return $this->belongsTo(OpnameStok::class, 'opname_stok_id');
    }

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(LotStok::class, 'lot_stok_id');
    }
}

