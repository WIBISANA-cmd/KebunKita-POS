<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlokasiJualLot extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'alokasi_jual_lot';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'item_jual_id',
        'lot_stok_id',
        'qty_dasar',
        'hpp_rp',
    ];

    protected $casts = [
        'qty_dasar' => 'string',
        'hpp_rp' => 'string',
    ];

    public function itemJual(): BelongsTo
    {
        return $this->belongsTo(ItemJual::class, 'item_jual_id');
    }

    public function lotStok(): BelongsTo
    {
        return $this->belongsTo(LotStok::class, 'lot_stok_id');
    }
}

