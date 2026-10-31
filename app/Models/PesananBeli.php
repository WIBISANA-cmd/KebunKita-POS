<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PesananBeli extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pesanan_beli';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cabang_id',
        'pemasok_id',
        'nomor',
        'status',
        'total_rp',
        'catatan',
    ];

    protected $casts = [
        'total_rp' => 'string',
    ];

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'cabang_id');
    }

    public function pemasok(): BelongsTo
    {
        return $this->belongsTo(Pemasok::class, 'pemasok_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemBeli::class, 'pesanan_beli_id');
    }

    public function penerimaan(): HasMany
    {
        return $this->hasMany(TerimaBeli::class, 'pesanan_beli_id');
    }
}

