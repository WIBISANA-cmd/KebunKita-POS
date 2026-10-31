<?php

namespace App\Support;

class Qty
{
    /**
     * Konversi kuantitas dari satuan turunan ke satuan dasar dengan presisi tinggi.
     */
    public static function keSatuanDasar(string|float|int $qty, string|float|int $faktorKeDasar): string
    {
        return bcadd(bcmul((string) $qty, (string) $faktorKeDasar, 6), '0', 3);
    }

    /**
     * Perkalian dua nilai kuantitas dengan presisi 3 desimal.
     */
    public static function kali(string|float|int $a, string|float|int $b): string
    {
        return bcadd(bcmul((string) $a, (string) $b, 6), '0', 3);
    }

    /**
     * Bersihkan input kuantitas menjadi format string desimal presisi 3 digit (contoh: "1.500").
     */
    public static function bersihkan(string|float|int|null $qty): string
    {
        if ($qty === null || $qty === '') {
            return '0.000';
        }

        if (is_numeric($qty)) {
            return number_format((float) $qty, 3, '.', '');
        }

        $str = trim((string) $qty);
        $str = str_replace(',', '.', $str);
        $clean = preg_replace('/[^\d\.]/', '', $str);

        return is_numeric($clean) ? number_format((float) $clean, 3, '.', '') : '0.000';
    }

    /**
     * Tambah kuantitas dalam satuan dasar (presisi 3 desimal / gram).
     */
    public static function tambah(string|float|int $a, string|float|int $b): string
    {
        return bcadd((string) $a, (string) $b, 3);
    }

    /**
     * Kurang kuantitas dalam satuan dasar.
     */
    public static function kurang(string|float|int $a, string|float|int $b): string
    {
        return bcsub((string) $a, (string) $b, 3);
    }

    /**
     * Bandingkan kuantitas ($a <=> $b): return -1 jika $a < $b, 0 jika sama, 1 jika $a > $b.
     */
    public static function bandingkan(string|float|int $a, string|float|int $b): int
    {
        return bccomp((string) $a, (string) $b, 3);
    }

    /**
     * Cek apakah kuantitas bernilai positif (> 0).
     */
    public static function lebihDariNol(string|float|int $qty): bool
    {
        return bccomp((string) $qty, '0', 3) > 0;
    }
}
