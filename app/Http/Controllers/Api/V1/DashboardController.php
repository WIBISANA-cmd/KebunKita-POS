<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Laporan\DashboardService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function ringkasan(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $ringkasan = $this->dashboardService->ambilRingkasan($cabangId);

        return ResponsApi::sukses($ringkasan, 'Ringkasan KPI dashboard berhasil dimuat.');
    }

    public function grafikPenjualan(Request $request): JsonResponse
    {
        $request->validate(['periode' => 'nullable|in:7hari,4minggu,6bulan']);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $grafik = $this->dashboardService->ambilTrenPenjualan($cabangId, $request->query('periode', '7hari'));

        return ResponsApi::sukses($grafik, 'Tren grafik penjualan berhasil dimuat.');
    }

    public function penjualanKategori(Request $request): JsonResponse
    {
        $request->validate(['periode' => 'nullable|in:hari_ini,7hari,30hari']);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $data = $this->dashboardService->ambilPenjualanKategori($cabangId, $request->query('periode', '7hari'));

        return ResponsApi::sukses($data, 'Pangsa penjualan per kategori berhasil dimuat.');
    }

    public function metodeBayar(Request $request): JsonResponse
    {
        $request->validate(['periode' => 'nullable|in:hari_ini,7hari,30hari']);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $data = $this->dashboardService->ambilPangsaMetodeBayar($cabangId, $request->query('periode', '7hari'));

        return ResponsApi::sukses($data, 'Pangsa metode pembayaran berhasil dimuat.');
    }

    public function topProduk(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $top = $this->dashboardService->ambilTopProduk($cabangId);

        return ResponsApi::sukses($top, 'Daftar produk terlaris berhasil dimuat.');
    }
}
