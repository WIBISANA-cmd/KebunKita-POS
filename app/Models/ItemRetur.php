<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemRetur extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'item_retur';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'retur_jual_id',
        'item_jual_id',
        'qty',
        'nilai_refund_rp',
        'layak_jual',
        'keterangan_kondisi',
    ];

    protected $casts = [
        'qty' => 'string',
        'nilai_refund_rp' => 'string',
        'layak_jual' => 'boolean',
    ];

    public function returJual(): BelongsTo
    {
        return $this->belongsTo(ReturJual::class, 'retur_jual_id');
    }

    public function itemJual(): BelongsTo
    {
        return $this->belongsTo(ItemJual::class, 'item_jual_id');
    }
}

