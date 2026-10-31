<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Peran extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'peran';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode',
        'nama',
        'deskripsi',
    ];

    public function izin(): BelongsToMany
    {
        return $this->belongsToMany(Izin::class, 'peran_izin', 'peran_id', 'izin_id');
    }

    public function pengguna(): BelongsToMany
    {
        return $this->belongsToMany(Pengguna::class, 'pengguna_peran', 'peran_id', 'pengguna_id')
            ->withPivot('cabang_id')
            ->withTimestamps();
    }
}

