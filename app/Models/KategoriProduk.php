<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KategoriProduk extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'kategori_produk';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama',
        'induk_id',
        'urutan',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'urutan' => 'integer',
    ];

    public function induk(): BelongsTo
    {
        return $this->belongsTo(self::class, 'induk_id');
    }

    public function anak(): HasMany
    {
        return $this->hasMany(self::class, 'induk_id')->orderBy('urutan', 'asc');
    }

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class, 'kategori_produk_id');
    }
}

