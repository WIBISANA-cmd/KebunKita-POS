<?php

namespace App\Services\Produk;

use App\Models\KategoriProduk;
use Illuminate\Database\Eloquent\Collection;

class KategoriService
{
    public function semua(bool $hanyaAktif = true): Collection
    {
        $query = KategoriProduk::withCount('produk')->orderBy('urutan', 'asc');
        if ($hanyaAktif) {
            $query->where('aktif', true);
        }
        return $query->get();
    }

    public function buat(array $data): KategoriProduk
    {
        return KategoriProduk::create([
            'nama' => trim($data['nama']),
            'induk_id' => $data['induk_id'] ?? null,
            'urutan' => $data['urutan'] ?? 0,
            'aktif' => $data['aktif'] ?? true,
        ]);
    }
}

