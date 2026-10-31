<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produk extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'produk';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kategori_produk_id',
        'satuan_dasar_id',
        'sku',
        'nama',
        'deskripsi',
        'tipe_jual',
        'foto_url',
        'stok_minimum',
        'aktif',
    ];

    protected $casts = [
        'stok_minimum' => 'string',
        'aktif' => 'boolean',
    ];

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(KategoriProduk::class, 'kategori_produk_id');
    }

    public function satuanDasar(): BelongsTo
    {
        return $this->belongsTo(Satuan::class, 'satuan_dasar_id');
    }

    public function satuanProduk(): HasMany
    {
        return $this->hasMany(SatuanProduk::class, 'produk_id');
    }

    public function saldoStok(): HasMany
    {
        return $this->hasMany(SaldoStok::class, 'produk_id');
    }

    public function lotStok(): HasMany
    {
        return $this->hasMany(LotStok::class, 'produk_id');
    }

    /**
     * Scope pencarian cepat SKU, barcode, atau nama produk.
     */
    public function scopeCari(Builder $query, ?string $q): Builder
    {
        if (! $q) {
            return $query;
        }

        return $query->where(function ($sub) use ($q) {
            $sub->where('nama', 'ilike', "%{$q}%")
                ->orWhere('sku', 'ilike', "%{$q}%")
                ->orWhereHas('satuanProduk', function ($satSub) use ($q) {
                    $satSub->where('barcode', 'ilike', "%{$q}%");
                });
        });
    }
}

