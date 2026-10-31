<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LotStok;
use App\Models\SaldoStok;
use App\Services\Persediaan\StokService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StokController extends Controller
{
    public function __construct(
        protected StokService $stokService
    ) {}

    public function saldo(Request $request): JsonResponse
    {
        $query = SaldoStok::with(['produk.satuanDasar', 'lokasi']);

        if ($request->query('produk_id')) {
            $query->where('produk_id', $request->query('produk_id'));
        }

        if ($request->query('lokasi_stok_id')) {
            $query->where('lokasi_stok_id', $request->query('lokasi_stok_id'));
        }

        $saldo = $query->paginate(Paginasi::perHalaman($request, 20));

        return ResponsApi::pagination($saldo, 'Saldo stok berhasil dimuat.');
    }

    public function lotAktif(Request $request): JsonResponse
    {
        $query = LotStok::with(['produk.satuanDasar', 'lokasi'])
            ->where('qty_sisa', '>', 0)
            ->orderByRaw('kedaluwarsa_pada ASC NULLS LAST')
            ->orderBy('created_at', 'asc')
            ->orderBy('id');

        if ($request->query('produk_id')) {
            $query->where('produk_id', $request->query('produk_id'));
        }

        if ($request->query('lokasi_stok_id')) {
            $query->where('lokasi_stok_id', $request->query('lokasi_stok_id'));
        }

        $lots = $query->paginate(Paginasi::perHalaman($request, 20));

        return ResponsApi::pagination($lots, 'Daftar lot stok FEFO berhasil dimuat.');
    }

    public function mutasi(Request $request): JsonResponse
    {
        $mutasi = $this->stokService->riwayatMutasi(
            $request->query('produk_id'),
            $request->query('lokasi_stok_id'),
            Paginasi::perHalaman($request, 20)
        );

        return ResponsApi::pagination($mutasi, 'Kartu mutasi stok berhasil dimuat.');
    }
}

