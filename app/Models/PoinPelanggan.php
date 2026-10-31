<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PoinPelanggan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'poin_pelanggan';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pelanggan_id',
        'penjualan_id',
        'jenis',
        'jumlah_poin',
        'keterangan',
    ];

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(Pelanggan::class, 'pelanggan_id');
    }

    public function penjualan(): BelongsTo
    {
        return $this->belongsTo(Penjualan::class, 'penjualan_id');
    }
}

