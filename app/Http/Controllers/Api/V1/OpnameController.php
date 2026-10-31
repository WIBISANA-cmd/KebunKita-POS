<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Persediaan\OpnameService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpnameController extends Controller
{
    public function __construct(
        protected OpnameService $opnameService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lokasi_stok_id' => ['required', 'uuid', 'exists:lokasi_stok,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.produk_id' => ['required', 'uuid', 'exists:produk,id'],
            'items.*.qty_fisik' => ['required', 'numeric', 'gte:0'],
        ]);

        $cabangId = $request->user()->cabang_id;
        $opname = $this->opnameService->postingOpname(
            $validated,
            $cabangId,
            $request->user()->id
        );

        return ResponsApi::sukses($opname, 'Stock opname berhasil diposting dan saldo stok telah disesuaikan.', 201);
    }
}

