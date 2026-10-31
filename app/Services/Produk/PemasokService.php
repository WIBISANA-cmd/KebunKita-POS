<?php

namespace App\Services\Produk;

use App\Models\Pemasok;
use Illuminate\Database\Eloquent\Collection;

class PemasokService
{
    public function semua(bool $hanyaAktif = true): Collection
    {
        $query = Pemasok::orderBy('nama', 'asc');
        if ($hanyaAktif) {
            $query->where('aktif', true);
        }
        return $query->get();
    }

    public function buat(array $data): Pemasok
    {
        return Pemasok::create([
            'nama' => trim($data['nama']),
            'kontak' => $data['kontak'] ?? null,
            'telepon' => $data['telepon'] ?? null,
            'alamat' => $data['alamat'] ?? null,
            'aktif' => $data['aktif'] ?? true,
        ]);
    }
}

