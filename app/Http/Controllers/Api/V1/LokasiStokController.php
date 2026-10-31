<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LokasiStok;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LokasiStokController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cabangId = $request->query('cabang_id') ?: $request->user()?->cabang_id;
        $lokasi = LokasiStok::where('cabang_id', $cabangId)->orderBy('nama', 'asc')->get();

        return ResponsApi::sukses($lokasi, 'Daftar lokasi stok berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:30'],
            'nama' => ['required', 'string', 'max:100'],
            'tipe' => ['nullable', 'string', 'in:gudang,rak_toko,retur'],
        ]);

        $cabangId = $request->user()->cabang_id;
        $lokasi = LokasiStok::create([
            'cabang_id' => $cabangId,
            'kode' => strtoupper(trim($validated['kode'])),
            'nama' => trim($validated['nama']),
            'tipe' => $validated['tipe'] ?? 'gudang',
        ]);

        return ResponsApi::sukses($lokasi, 'Lokasi stok baru berhasil dibuat.', 201);
    }
}

