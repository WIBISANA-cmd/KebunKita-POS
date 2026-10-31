<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TerimaBeli extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'terima_beli';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pesanan_beli_id',
        'lokasi_stok_id',
        'nomor',
        'waktu_terima',
        'penerima_id',
    ];

    protected $casts = [
        'waktu_terima' => 'datetime',
    ];

    public function pesananBeli(): BelongsTo
    {
        return $this->belongsTo(PesananBeli::class, 'pesanan_beli_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(LokasiStok::class, 'lokasi_stok_id');
    }

    public function penerima(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'penerima_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemTerima::class, 'terima_beli_id');
    }
}

