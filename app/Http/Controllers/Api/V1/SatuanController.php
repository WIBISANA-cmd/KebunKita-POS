<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Produk\SatuanService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SatuanController extends Controller
{
    public function __construct(
        protected SatuanService $satuanService
    ) {}

    public function index(): JsonResponse
    {
        $satuan = $this->satuanService->semua();
        return ResponsApi::sukses($satuan, 'Daftar satuan berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:20', 'unique:satuan,kode'],
            'nama' => ['required', 'string', 'max:50'],
            'jenis' => ['nullable', 'string', 'max:30'],
        ]);

        $satuan = $this->satuanService->buat($validated);
        return ResponsApi::sukses($satuan, 'Satuan berhasil dibuat.', 201);
    }
}

