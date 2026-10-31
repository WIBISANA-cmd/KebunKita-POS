<?php

namespace App\Support;

use Illuminate\Support\Str;

class NomorDokumen
{
    /**
     * Buat nomor dokumen unik per prefix dan waktu (mis. TRX-20261030-A8F2).
     */
    public static function buat(string $prefix = 'DOC'): string
    {
        $tanggal = now()->format('Ymd');
        $acak = strtoupper(Str::random(5));
        return "{$prefix}-{$tanggal}-{$acak}";
    }
}

