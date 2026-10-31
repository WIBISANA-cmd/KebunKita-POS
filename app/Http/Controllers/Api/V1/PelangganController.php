<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Produk\PelangganService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PelangganController extends Controller
{
    public function __construct(
        protected PelangganService $pelangganService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $pelanggan = $this->pelangganService->daftar(
            $request->query('q'),
            Paginasi::perHalaman($request, 20)
        );
        return ResponsApi::pagination($pelanggan, 'Daftar pelanggan berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:150'],
            'telepon' => ['nullable', 'string', 'max:30', 'unique:pelanggan,telepon'],
            'email' => ['nullable', 'email', 'max:150'],
            'alamat' => ['nullable', 'string'],
        ]);

        $pelanggan = $this->pelangganService->buat($validated);
        return ResponsApi::sukses($pelanggan, 'Pelanggan baru berhasil ditambahkan.', 201);
    }
}

