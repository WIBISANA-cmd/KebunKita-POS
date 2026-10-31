<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Persediaan\SusutService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SusutController extends Controller
{
    public function __construct(
        protected SusutService $susutService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lokasi_stok_id' => ['required', 'uuid', 'exists:lokasi_stok,id'],
            'alasan' => ['required', 'string', 'max:100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.lot_stok_id' => ['required', 'uuid', 'exists:lot_stok,id'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'],
        ]);

        $cabangId = $request->user()->cabang_id;
        $susut = $this->susutService->catatSusut(
            $validated,
            $cabangId,
            $request->user()->id
        );

        return ResponsApi::sukses($susut, 'Pencatatan susut sayur berhasil diposting ke ledger stok.', 201);
    }
}

