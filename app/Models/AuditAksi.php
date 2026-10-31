<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditAksi extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'audit_aksi';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pengguna_id',
        'cabang_id',
        'aksi',
        'entitas',
        'entitas_id',
        'data_lama',
        'data_baru',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'data_lama' => 'array',
        'data_baru' => 'array',
    ];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'pengguna_id');
    }

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }
}

