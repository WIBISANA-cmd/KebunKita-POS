<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemSusut extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_susut';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'susut_stok_id',
        'lot_stok_id',
        'qty',
        'nilai_hpp_rp',
    ];

    protected $casts = [
        'qty' => 'string',
        'nilai_hpp_rp' => 'string',
    ];

    public function susut(): BelongsTo
    {
        return $this->belongsTo(SusutStok::class, 'susut_stok_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(LotStok::class, 'lot_stok_id');
    }
}

