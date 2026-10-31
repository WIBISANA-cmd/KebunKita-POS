<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundBayar extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'refund_bayar';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'retur_jual_id',
        'metode_bayar_id',
        'nilai_rp',
        'status',
        'ref_eksternal',
    ];

    protected $casts = [
        'nilai_rp' => 'string',
    ];

    public function returJual(): BelongsTo
    {
        return $this->belongsTo(ReturJual::class, 'retur_jual_id');
    }

    public function metodeBayar(): BelongsTo
    {
        return $this->belongsTo(MetodeBayar::class, 'metode_bayar_id');
    }
}

