<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Pengguna extends Authenticatable
{
    use HasFactory, HasUuids, HasApiTokens, Notifiable;

    protected $table = 'pengguna';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'nama',
        'email',
        'password',
        'telepon',
        'aktif',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'aktif' => 'boolean',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function peran(): BelongsToMany
    {
        return $this->belongsToMany(Peran::class, 'pengguna_peran', 'pengguna_id', 'peran_id')
            ->withPivot('cabang_id')
            ->withTimestamps();
    }

    /**
     * Periksa apakah pengguna memiliki peran tertentu (mis. 'pemilik', 'manajer', 'kasir').
     */
    public function punyaPeran(string $kodePeran): bool
    {
        return $this->peran->contains('kode', $kodePeran);
    }

    /**
     * Periksa apakah pengguna memiliki izin aksi tertentu, dibatasi scope cabang.
     */
    public function punyaIzin(string $kodeIzin, ?string $cabangId = null): bool
    {
        // Pemilik usaha memiliki hak mutlak ke seluruh cabang
        if ($this->punyaPeran('pemilik')) {
            return true;
        }

        foreach ($this->peran as $p) {
            // Periksa batasan cabang pada pivot jika ditentukan
            $pivotCabang = $p->pivot?->cabang_id;
            if ($cabangId && $pivotCabang && $pivotCabang !== $cabangId) {
                continue;
            }

            if ($p->izin->contains('kode', $kodeIzin)) {
                return true;
            }
        }

        return false;
    }
}

