<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutasiKas extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'mutasi_kas';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'shift_kasir_id',
        'jenis',
        'masuk_rp',
        'keluar_rp',
        'nomor_ref',
        'keterangan',
    ];

    protected $casts = [
        'masuk_rp' => 'string',
        'keluar_rp' => 'string',
    ];

    public function shiftKasir(): BelongsTo
    {
        return $this->belongsTo(ShiftKasir::class, 'shift_kasir_id');
    }
}

