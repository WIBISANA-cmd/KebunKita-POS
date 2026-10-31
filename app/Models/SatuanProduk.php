<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SatuanProduk extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'satuan_produk';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'produk_id',
        'satuan_id',
        'faktor_ke_dasar',
        'barcode',
        'bisa_dijual',
        'bisa_dibeli',
    ];

    protected $casts = [
        'faktor_ke_dasar' => 'string',
        'bisa_dijual' => 'boolean',
        'bisa_dibeli' => 'boolean',
    ];

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function satuan(): BelongsTo
    {
        return $this->belongsTo(Satuan::class, 'satuan_id');
    }

    public function riwayatHarga(): HasMany
    {
        return $this->hasMany(HargaProduk::class, 'satuan_produk_id');
    }

    public function getFaktorKonversiAttribute(): string
    {
        return $this->faktor_ke_dasar ?? '1.000000';
    }

    /**
     * Harga aktif saat ini untuk cabang tertentu (atau harga default nasional).
     */
    public function hargaAktif(?string $cabangId = null): HasOne
    {
        $relasi = $this->hasOne(HargaProduk::class, 'satuan_produk_id')
            ->where('mulai_pada', '<=', now())
            ->where(function ($q) {
                $q->whereNull('akhir_pada')->orWhere('akhir_pada', '>=', now());
            })
            ->orderBy('cabang_id', 'desc') // Cabang spesifik diutamakan dibanding null
            ->orderBy('mulai_pada', 'desc');

        if ($cabangId) {
            $relasi->where(function ($q) use ($cabangId) {
                $q->where('cabang_id', $cabangId)->orWhereNull('cabang_id');
            });
        }

        return $relasi;
    }
}

