<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BayarJual extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bayar_jual';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'penjualan_id',
        'metode_bayar_id',
        'nilai_rp',
        'diterima_rp',
        'kembalian_rp',
        'status',
        'ref_eksternal',
    ];

    protected $casts = [
        'nilai_rp' => 'string',
        'diterima_rp' => 'string',
        'kembalian_rp' => 'string',
    ];

    public function penjualan(): BelongsTo
    {
        return $this->belongsTo(Penjualan::class, 'penjualan_id');
    }

    public function metodeBayar(): BelongsTo
    {
        return $this->belongsTo(MetodeBayar::class, 'metode_bayar_id');
    }
}

