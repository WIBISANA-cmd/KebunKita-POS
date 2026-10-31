<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PesananBeli;
use App\Services\Pembelian\PembelianService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PembelianController extends Controller
{
    public function __construct(
        protected PembelianService $pembelianService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cabangId = $request->query('cabang_id') ?: $request->user()?->cabang_id;
        $poList = $this->pembelianService->daftar(
            $cabangId,
            $request->query('status'),
            Paginasi::perHalaman($request, 15)
        );

        return ResponsApi::pagination($poList, 'Daftar pesanan beli berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pemasok_id' => ['required', 'uuid', 'exists:pemasok,id'],
            'catatan' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.satuan_produk_id' => ['required', 'uuid', 'exists:satuan_produk,id'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'],
            'items.*.harga_rp' => ['required', 'numeric', 'gte:0'],
        ]);

        $cabangId = $request->user()->cabang_id;
        $po = $this->pembelianService->buat($validated, $cabangId);

        return ResponsApi::sukses($po, 'Pesanan beli berhasil dibuat.', 201);
    }

    public function show(PesananBeli $pembelian): JsonResponse
    {
        return ResponsApi::sukses(
            $pembelian->load(['pemasok', 'cabang', 'items.produk.satuanDasar', 'items.satuanProduk.satuan', 'penerimaan.items']),
            'Detail pesanan beli berhasil dimuat.'
        );
    }

    public function setujui(PesananBeli $pembelian): JsonResponse
    {
        $disetujui = $this->pembelianService->setujui($pembelian);
        return ResponsApi::sukses($disetujui, 'Pesanan beli berhasil disetujui.');
    }
}

