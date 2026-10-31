<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DokumenStok extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dokumen_stok';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'jenis',
        'nomor',
        'referensi_id',
        'waktu_posting',
    ];

    protected $casts = [
        'waktu_posting' => 'datetime',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function mutasi(): HasMany
    {
        return $this->hasMany(MutasiStok::class, 'dokumen_stok_id');
    }
}

