<?php

namespace App\Services\Produk;

use App\Models\Pelanggan;
use Illuminate\Pagination\LengthAwarePaginator;

class PelangganService
{
    public function daftar(?string $q = null, int $perHalaman = 20): LengthAwarePaginator
    {
        $query = Pelanggan::orderBy('nama', 'asc')->orderBy('id');

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'ilike', "%{$q}%")
                    ->orWhere('telepon', 'ilike', "%{$q}%");
            });
        }

        return $query->paginate($perHalaman);
    }

    public function buat(array $data): Pelanggan
    {
        return Pelanggan::create([
            'nama' => trim($data['nama']),
            'telepon' => $data['telepon'] ?? null,
            'email' => $data['email'] ?? null,
            'alamat' => $data['alamat'] ?? null,
            'aktif' => $data['aktif'] ?? true,
        ]);
    }
}

