<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Penjualan\NotifikasiTransaksiService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    public function __construct(
        protected NotifikasiTransaksiService $notifikasiService
    ) {}

    public function transaksi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batas' => 'nullable|integer|min:1|max:20',
            'sejak' => 'nullable|date',
        ]);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $data = $this->notifikasiService->ambil(
            $cabangId,
            (int) ($validated['batas'] ?? 8),
            $validated['sejak'] ?? null
        );

        return ResponsApi::sukses($data, 'Transaksi terakhir berhasil dimuat.');
    }
}
