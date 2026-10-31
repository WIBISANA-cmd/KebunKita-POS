<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\PenjualanSelesai;
use App\Http\Controllers\Controller;
use App\Services\Penjualan\KasirService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenjualanController extends Controller
{
    public function __construct(
        protected KasirService $kasirService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $filter = $request->only(['cari', 'status', 'tanggal_awal', 'tanggal_akhir']);
        $filter['per_page'] = Paginasi::perHalaman($request, 15);

        $penjualan = $this->kasirService->daftarPenjualan($cabangId, $filter);

        return ResponsApi::pagination($penjualan, 'Daftar riwayat transaksi penjualan berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'idempotency_key' => 'nullable|string|max:100',
            'tipe_pesanan' => 'nullable|string|in:take_away,dine_in,delivery,custom',
            'pelanggan_id' => 'nullable|uuid|exists:pelanggan,id',
            'diskon_rp' => 'nullable|numeric|min:0',
            'pajak_rp' => 'nullable|numeric|min:0',
            'catatan' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|uuid|exists:produk,id',
            'items.*.satuan_produk_id' => 'required|uuid|exists:satuan_produk,id',
            'items.*.qty' => 'required|numeric|gt:0',
            'items.*.diskon_rp' => 'nullable|numeric|min:0',
            'pembayaran' => 'required|array|min:1',
            'pembayaran.*.metode_bayar_id' => 'required|uuid|exists:metode_bayar,id',
            'pembayaran.*.nilai_rp' => 'required|numeric|min:1',
            'pembayaran.*.diterima_rp' => 'nullable|numeric|min:1',
            'pembayaran.*.ref_eksternal' => 'nullable|string|max:100',
        ]);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $penggunaId = $request->user()->id;

        $penjualan = $this->kasirService->selesaikanPenjualan($validated, $cabangId, $penggunaId);

        defer(fn () => rescue(fn () => PenjualanSelesai::dispatch($penjualan)));

        return ResponsApi::sukses($penjualan, 'Transaksi penjualan berhasil diselesaikan.', 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $penjualan = $this->kasirService->ambilDetailNota($id, $cabangId);

        return ResponsApi::sukses($penjualan, 'Detail nota transaksi berhasil dimuat.');
    }
}
