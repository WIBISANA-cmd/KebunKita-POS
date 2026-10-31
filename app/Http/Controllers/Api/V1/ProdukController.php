<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Produk\SimpanProdukRequest;
use App\Http\Requests\Produk\UbahProdukRequest;
use App\Models\Produk;
use App\Services\Produk\ProdukService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProdukController extends Controller
{
    public function __construct(
        protected ProdukService $produkService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cabangId = $request->query('cabang_id') ?: $request->user()?->cabang_id;
        $perHalaman = Paginasi::perHalaman($request, 100);

        $daftar = $this->produkService->daftar(
            $request->query('kategori_id'),
            $request->query('q'),
            $cabangId,
            $request->boolean('aktif', true),
            $perHalaman
        );

        return ResponsApi::pagination($daftar, 'Daftar produk berhasil dimuat.');
    }

    public function store(SimpanProdukRequest $request): JsonResponse
    {
        $cabangId = $request->user()?->cabang_id;
        $produk = $this->produkService->buat($request->validated(), $cabangId);

        return ResponsApi::sukses($produk, 'Produk baru berhasil ditambahkan.', 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $cabangId = $request->query('cabang_id') ?: $request->user()?->cabang_id;
        $produk = $this->produkService->detail($id, $cabangId);

        return ResponsApi::sukses($produk, 'Detail produk berhasil dimuat.');
    }

    public function update(UbahProdukRequest $request, Produk $produk): JsonResponse
    {
        $cabangId = $request->user()?->cabang_id;
        $terbarui = $this->produkService->perbarui($produk, $request->validated(), $cabangId);

        return ResponsApi::sukses($terbarui, 'Data produk berhasil diperbarui.');
    }

    public function destroy(Produk $produk): JsonResponse
    {
        $this->produkService->arsipkan($produk);

        return ResponsApi::sukses(null, 'Produk berhasil diarsipkan.');
    }
}

