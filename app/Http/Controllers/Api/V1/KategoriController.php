<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Produk\KategoriService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KategoriController extends Controller
{
    public function __construct(
        protected KategoriService $kategoriService
    ) {}

    public function index(): JsonResponse
    {
        $kategori = $this->kategoriService->semua();
        return ResponsApi::sukses($kategori, 'Daftar kategori produk berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'induk_id' => ['nullable', 'uuid', 'exists:kategori_produk,id'],
            'urutan' => ['nullable', 'integer'],
        ]);

        $kategori = $this->kategoriService->buat($validated);
        return ResponsApi::sukses($kategori, 'Kategori produk berhasil dibuat.', 201);
    }
}

