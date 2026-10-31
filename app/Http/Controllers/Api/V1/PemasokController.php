<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Produk\PemasokService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PemasokController extends Controller
{
    public function __construct(
        protected PemasokService $pemasokService
    ) {}

    public function index(): JsonResponse
    {
        $pemasok = $this->pemasokService->semua();
        return ResponsApi::sukses($pemasok, 'Daftar pemasok berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:150'],
            'kontak' => ['nullable', 'string', 'max:100'],
            'telepon' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
        ]);

        $pemasok = $this->pemasokService->buat($validated);
        return ResponsApi::sukses($pemasok, 'Pemasok baru berhasil ditambahkan.', 201);
    }
}

