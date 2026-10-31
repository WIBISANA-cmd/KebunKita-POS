<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Izin extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'izin';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode',
        'nama',
    ];

    public function peran(): BelongsToMany
    {
        return $this->belongsToMany(Peran::class, 'peran_izin', 'izin_id', 'peran_id');
    }
}

