<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Laporan\LaporanService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    public function __construct(
        protected LaporanService $laporanService
    ) {}

    public function penjualan(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $filter = $request->only(['tanggal_awal', 'tanggal_akhir', 'status']);
        $filter['per_page'] = Paginasi::perHalaman($request, 20);

        $laporan = $this->laporanService->laporanPenjualan($cabangId, $filter);

        return ResponsApi::pagination($laporan, 'Laporan transaksi penjualan berhasil dimuat.');
    }

    public function labaRugi(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal_awal' => 'required|date',
            'tanggal_akhir' => 'required|date|after_or_equal:tanggal_awal',
        ]);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $labaRugi = $this->laporanService->laporanLabaRugi(
            $cabangId,
            $request->query('tanggal_awal'),
            $request->query('tanggal_akhir')
        );

        return ResponsApi::sukses($labaRugi, 'Laporan laba rugi operasional berhasil dihitung.');
    }

    public function eksporPenjualan(Request $request): StreamedResponse
    {
        $request->validate([
            'tanggal_awal' => 'required|date',
            'tanggal_akhir' => 'required|date|after_or_equal:tanggal_awal',
        ]);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;

        return $this->laporanService->eksporCsvPenjualan(
            $cabangId,
            $request->query('tanggal_awal'),
            $request->query('tanggal_akhir')
        );
    }
}

