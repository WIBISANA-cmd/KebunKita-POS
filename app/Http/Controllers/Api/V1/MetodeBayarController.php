<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MetodeBayar;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetodeBayarController extends Controller
{
    public function index(): JsonResponse
    {
        $metode = MetodeBayar::where('aktif', true)->orderBy('nama')->get();

        return ResponsApi::sukses($metode, 'Daftar metode pembayaran berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:30|unique:metode_bayar,kode',
            'nama' => 'required|string|max:50',
            'jenis' => 'required|string|in:tunai,transfer,qris,kartu',
            'aktif' => 'boolean',
        ]);

        $metode = MetodeBayar::create($validated);

        return ResponsApi::sukses($metode, 'Metode pembayaran berhasil ditambahkan.', 201);
    }
}

