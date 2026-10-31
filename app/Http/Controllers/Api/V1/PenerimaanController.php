<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PesananBeli;
use App\Services\Pembelian\PenerimaanService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenerimaanController extends Controller
{
    public function __construct(
        protected PenerimaanService $penerimaanService
    ) {}

    public function store(Request $request, PesananBeli $pembelian): JsonResponse
    {
        $validated = $request->validate([
            'lokasi_stok_id' => ['required', 'uuid', 'exists:lokasi_stok,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_beli_id' => ['required', 'uuid', 'exists:item_beli,id'],
            'items.*.qty_diterima' => ['required', 'numeric', 'gt:0'],
            'items.*.kedaluwarsa_pada' => ['nullable', 'date'],
        ]);

        $penerimaan = $this->penerimaanService->prosesPenerimaan(
            $pembelian,
            $validated,
            $request->user()->id
        );

        return ResponsApi::sukses($penerimaan, 'Penerimaan barang berhasil diproses dan lot stok telah dibuat.', 201);
    }
}

