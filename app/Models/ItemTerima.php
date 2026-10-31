<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ItemTerima extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_terima';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'terima_beli_id',
        'item_beli_id',
        'qty_diterima',
        'biaya_satuan_rp',
        'kedaluwarsa_pada',
    ];

    protected $casts = [
        'qty_diterima' => 'string',
        'biaya_satuan_rp' => 'string',
        'kedaluwarsa_pada' => 'datetime',
    ];

    public function terimaBeli(): BelongsTo
    {
        return $this->belongsTo(TerimaBeli::class, 'terima_beli_id');
    }

    public function itemBeli(): BelongsTo
    {
        return $this->belongsTo(ItemBeli::class, 'item_beli_id');
    }

    public function lot(): HasOne
    {
        return $this->hasOne(LotStok::class, 'item_terima_id');
    }
}

