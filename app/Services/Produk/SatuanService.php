<?php

namespace App\Services\Produk;

use App\Models\Satuan;
use Illuminate\Database\Eloquent\Collection;

class SatuanService
{
    public function semua(): Collection
    {
        return Satuan::orderBy('nama', 'asc')->get();
    }

    public function buat(array $data): Satuan
    {
        return Satuan::create([
            'kode' => strtolower(trim($data['kode'])),
            'nama' => trim($data['nama']),
            'jenis' => $data['jenis'] ?? 'berat',
        ]);
    }
}

