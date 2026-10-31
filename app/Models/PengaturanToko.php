<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengaturanToko extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pengaturan_toko';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'kunci',
        'nilai_json',
    ];

    protected $casts = [
        'nilai_json' => 'array',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }
}

