<?php

namespace App\Support;

class Uang
{
    /**
     * Hitung subtotal perkalian kuantitas dan harga satuan dengan pembulatan akuntansi HALF_UP.
     */
    public static function kali(string|float|int $qty, string|int $hargaSatuanRp): string
    {
        $hasil = bcmul((string) $qty, (string) $hargaSatuanRp, 4);
        return (string) (int) round((float) $hasil);
    }

    /**
     * Tambah dua nilai uang Rupiah bulat.
     */
    public static function tambah(string|int $a, string|int $b): string
    {
        return (string) (int) bcadd((string) $a, (string) $b, 0);
    }

    /**
     * Kurang dua nilai uang Rupiah bulat.
     */
    public static function kurang(string|int $a, string|int $b): string
    {
        return (string) (int) bcsub((string) $a, (string) $b, 0);
    }

    /**
     * Bandingkan dua nilai uang ($a <=> $b): return -1 jika $a < $b, 0 jika sama, 1 jika $a > $b.
     */
    public static function bandingkan(string|int $a, string|int $b): int
    {
        return bccomp((string) $a, (string) $b, 0);
    }

    /**
     * Cek apakah nominal bernilai lebih dari nol (> 0).
     */
    public static function lebihDariNol(string|int $nominal): bool
    {
        return bccomp((string) $nominal, '0', 0) > 0;
    }

    /**
     * Cek apakah dua nilai nominal sama besar.
     */
    public static function samaDengan(string|int $a, string|int $b): bool
    {
        return bccomp((string) $a, (string) $b, 0) === 0;
    }

    /**
     * Bersihkan input string/angka menjadi representasi string nominal bulat (IDR integer).
     */
    public static function bersihkan(string|float|int|null $nominal): string
    {
        if ($nominal === null || $nominal === '') {
            return '0';
        }

        if (is_int($nominal)) {
            return (string) $nominal;
        }

        if (is_float($nominal)) {
            return (string) (int) round($nominal);
        }

        $str = trim((string) $nominal);

        // Hapus prefix "Rp" atau simbol mata uang
        $str = preg_replace('/^Rp\.?\s*/i', '', $str);

        // Jika string sudah murni integer (misal "50000" atau "-5000")
        if (preg_match('/^-?\d+$/', $str)) {
            return $str;
        }

        // Format Rupiah Indonesia: terdapat pemisah ribuan titik dan koma desimal (misal "100.000,00")
        if (str_contains($str, ',') && str_contains($str, '.')) {
            $str = str_replace('.', '', $str);
            $str = str_replace(',', '.', $str);
            return (string) (int) round((float) $str);
        }

        // Format jika hanya terdapat koma
        if (str_contains($str, ',')) {
            if (preg_match('/^\d+,\d{3}$/', $str)) {
                return str_replace(',', '', $str);
            }
            return (string) (int) round((float) str_replace(',', '.', $str));
        }

        // Format jika terdapat titik
        if (str_contains($str, '.')) {
            // Pola ribuan berulang (misal "1.000.000")
            if (substr_count($str, '.') > 1) {
                return str_replace('.', '', $str);
            }

            // Pola ribuan Indonesia tunggal: 1-3 digit diikuti titik dan tepat 3 digit (misal "50.000" atau "5.000")
            if (preg_match('/^-?\d{1,3}\.\d{3}$/', $str)) {
                return str_replace('.', '', $str);
            }

            // Format desimal standar (misal "50000.00")
            return (string) (int) round((float) $str);
        }

        $hanyaAngka = preg_replace('/[^\d\-]/', '', $str);
        return !empty($hanyaAngka) ? $hanyaAngka : '0';
    }

    /**
     * Format nilai Rupiah untuk UI/laporan (contoh: "Rp 18.000").
     */
    public static function formatRupiah(string|int $nominal): string
    {
        return 'Rp ' . number_format((float) $nominal, 0, ',', '.');
    }
}
