<?php

namespace App\Support;

use Illuminate\Http\Request;

class Paginasi
{
    /** Batas atas satu halaman agar satu permintaan tidak bisa menarik seluruh tabel. */
    public const PER_HALAMAN_MAKS = 100;

    /**
     * Baca ukuran halaman dari query string; `per_page` tetap diterima untuk klien lama.
     */
    public static function perHalaman(Request $request, int $bawaan = 20): int
    {
        $diminta = (int) ($request->query('per_halaman') ?: $request->query('per_page', $bawaan));

        return max(1, min($diminta, self::PER_HALAMAN_MAKS));
    }
}
