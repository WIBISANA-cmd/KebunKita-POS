<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Penjualan\ReturJualService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReturJualController extends Controller
{
    public function __construct(
        protected ReturJualService $returService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $filter = $request->only(['cari']);
        $filter['per_page'] = Paginasi::perHalaman($request, 15);

        $retur = $this->returService->daftarRetur($cabangId, $filter);

        return ResponsApi::pagination($retur, 'Daftar retur penjualan berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'penjualan_id' => 'required|uuid|exists:penjualan,id',
            'alasan' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.item_jual_id' => 'required|uuid|exists:item_jual,id',
            'items.*.qty' => 'required|numeric|gt:0',
            'items.*.layak_jual' => 'required|boolean',
            'items.*.keterangan_kondisi' => 'nullable|string|max:255',
            'refunds' => 'required|array|min:1',
            'refunds.*.metode_bayar_id' => 'required|uuid|exists:metode_bayar,id',
            'refunds.*.nilai_rp' => 'required|numeric|min:1',
            'refunds.*.ref_eksternal' => 'nullable|string|max:100',
        ]);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $penggunaId = $request->user()->id;

        $retur = $this->returService->prosesRetur($validated, $cabangId, $penggunaId);

        return ResponsApi::sukses($retur, 'Retur penjualan berhasil diproses dan dana telah direfund.', 201);
    }
}

