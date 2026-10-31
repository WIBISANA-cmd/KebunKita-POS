<?php

namespace App\Services\Pengguna;

use App\Models\Cabang;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CabangService
{
    /**
     * Ambil seluruh cabang toko yang aktif.
     */
    public function semua(bool $hanyaAktif = true): Collection
    {
        $query = Cabang::orderBy('nama', 'asc');
        if ($hanyaAktif) {
            $query->where('aktif', true);
        }
        return $query->get();
    }

    /**
     * Tambah cabang baru.
     */
    public function buat(array $data): Cabang
    {
        return DB::transaction(function () use ($data) {
            $cabang = Cabang::create([
                'kode' => strtoupper(trim($data['kode'])),
                'nama' => trim($data['nama']),
                'alamat' => $data['alamat'] ?? null,
                'telepon' => $data['telepon'] ?? null,
                'zona_waktu' => $data['zona_waktu'] ?? 'Asia/Jakarta',
                'aktif' => $data['aktif'] ?? true,
            ]);

            AuditService::catat('BUAT', 'cabang', $cabang->id, null, $cabang->toArray(), $cabang->id);

            return $cabang;
        });
    }

    /**
     * Perbarui data cabang.
     */
    public function perbarui(Cabang $cabang, array $data): Cabang
    {
        return DB::transaction(function () use ($cabang, $data) {
            $dataLama = $cabang->toArray();

            $cabang->update([
                'nama' => $data['nama'] ?? $cabang->nama,
                'alamat' => array_key_exists('alamat', $data) ? $data['alamat'] : $cabang->alamat,
                'telepon' => array_key_exists('telepon', $data) ? $data['telepon'] : $cabang->telepon,
                'zona_waktu' => $data['zona_waktu'] ?? $cabang->zona_waktu,
                'aktif' => array_key_exists('aktif', $data) ? (bool) $data['aktif'] : $cabang->aktif,
            ]);

            AuditService::catat('UBAH', 'cabang', $cabang->id, $dataLama, $cabang->toArray(), $cabang->id);

            return $cabang;
        });
    }
}

