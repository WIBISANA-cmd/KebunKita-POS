<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\MultiCabang\TransferStokService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransferStokController extends Controller
{
    public function __construct(
        protected TransferStokService $transferService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $filter = $request->only(['status']);
        $filter['per_page'] = Paginasi::perHalaman($request, 15);

        $transfers = $this->transferService->daftarTransfer($cabangId, $filter);

        return ResponsApi::pagination($transfers, 'Daftar transfer stok cabang berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cabang_tujuan_id' => 'required|uuid|exists:cabang,id',
            'catatan' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|uuid|exists:produk,id',
            'items.*.satuan_produk_id' => 'required|uuid|exists:satuan_produk,id',
            'items.*.qty_kirim' => 'required|numeric|gt:0',
        ]);

        $cabangAsalId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $pengirimId = $request->user()->id;

        $transfer = $this->transferService->kirimTransfer(
            $cabangAsalId,
            $validated['cabang_tujuan_id'],
            $pengirimId,
            $validated['items'],
            $validated['catatan'] ?? null
        );

        return ResponsApi::sukses($transfer, 'Pengiriman transfer stok berhasil diproses.', 201);
    }

    public function terima(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_transfer_id' => 'required|uuid|exists:item_transfer,id',
            'items.*.qty_terima' => 'required|numeric|min:0',
        ]);

        $cabangTujuanId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $penerimaId = $request->user()->id;

        $transfer = $this->transferService->terimaTransfer(
            $id,
            $cabangTujuanId,
            $penerimaId,
            $validated['items']
        );

        return ResponsApi::sukses($transfer, 'Transfer stok berhasil diterima dan dimasukkan ke persediaan cabang.');
    }
}

