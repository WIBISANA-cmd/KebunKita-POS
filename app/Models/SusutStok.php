<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SusutStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'susut_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'lokasi_stok_id',
        'nomor',
        'status',
        'alasan',
        'disetujui_oleh',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(LokasiStok::class, 'lokasi_stok_id');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'disetujui_oleh');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemSusut::class, 'susut_stok_id');
    }
}

