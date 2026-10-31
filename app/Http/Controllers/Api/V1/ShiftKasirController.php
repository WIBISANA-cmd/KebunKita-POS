<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Penjualan\ShiftKasirService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftKasirController extends Controller
{
    public function __construct(
        protected ShiftKasirService $shiftService
    ) {}

    public function statusAktif(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $penggunaId = $request->user()->id;

        $shift = $this->shiftService->ambilShiftAktif($cabangId, $penggunaId);

        return ResponsApi::sukses([
            'aktif' => $shift !== null,
            'shift' => $shift,
        ], 'Status shift kasir berhasil diperiksa.');
    }

    public function buka(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modal_awal_rp' => 'required|numeric|min:0',
        ]);

        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $penggunaId = $request->user()->id;

        $shift = $this->shiftService->bukaShift($cabangId, $penggunaId, (string) $validated['modal_awal_rp']);

        return ResponsApi::sukses($shift, 'Shift kasir berhasil dibuka.', 201);
    }

    public function tutup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shift_id' => 'required|uuid',
            'saldo_fisik_rp' => 'required|numeric|min:0',
            'catatan_selisih' => 'nullable|string',
        ]);

        $shift = $this->shiftService->tutupShift(
            $validated['shift_id'],
            (string) $validated['saldo_fisik_rp'],
            $validated['catatan_selisih'] ?? null
        );

        return ResponsApi::sukses($shift, 'Shift kasir berhasil ditutup dan direkonsiliasi.');
    }

    public function mutasiKasManual(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shift_id' => 'required|uuid',
            'jenis' => 'required|in:kas_masuk_manual,kas_keluar_manual',
            'jumlah_rp' => 'required|numeric|min:1',
            'keterangan' => 'required|string|max:255',
        ]);

        $mutasi = $this->shiftService->catatMutasiManual(
            $validated['shift_id'],
            $validated['jenis'],
            (string) $validated['jumlah_rp'],
            $validated['keterangan']
        );

        return ResponsApi::sukses($mutasi, 'Mutasi kas laci berhasil dicatat.');
    }

    public function riwayat(Request $request): JsonResponse
    {
        $cabangId = $request->header('X-Cabang-ID') ?? $request->user()->cabang_id;
        $riwayat = $this->shiftService->riwayatShift($cabangId);

        return ResponsApi::sukses($riwayat, 'Riwayat shift kasir berhasil dimuat.');
    }
}

