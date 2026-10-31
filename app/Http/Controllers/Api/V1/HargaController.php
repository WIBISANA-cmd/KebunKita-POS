<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Produk\TetapkanHargaRequest;
use App\Services\Produk\HargaService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;

class HargaController extends Controller
{
    public function __construct(
        protected HargaService $hargaService
    ) {}

    public function store(TetapkanHargaRequest $request): JsonResponse
    {
        $harga = $this->hargaService->tetapkanHarga($request->validated());
        return ResponsApi::sukses($harga, 'Harga baru berhasil ditetapkan.', 201);
    }

    public function riwayat(string $satuanProdukId): JsonResponse
    {
        $riwayat = $this->hargaService->riwayat($satuanProdukId);
        return ResponsApi::sukses($riwayat, 'Riwayat perubahan harga berhasil dimuat.');
    }
}

