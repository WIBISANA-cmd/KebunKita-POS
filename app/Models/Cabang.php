<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cabang extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'cabang';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode',
        'nama',
        'alamat',
        'telepon',
        'zona_waktu',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    public function pengguna(): HasMany
    {
        return $this->hasMany(Pengguna::class, 'cabang_id');
    }

    public function pengaturan(): HasMany
    {
        return $this->hasMany(PengaturanToko::class, 'cabang_id');
    }
}

