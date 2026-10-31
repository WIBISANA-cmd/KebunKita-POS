<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Satuan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'satuan';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode',
        'nama',
        'jenis',
    ];

    public function produkDasar(): HasMany
    {
        return $this->hasMany(Produk::class, 'satuan_dasar_id');
    }

    public function satuanProduk(): HasMany
    {
        return $this->hasMany(SatuanProduk::class, 'satuan_id');
    }
}

