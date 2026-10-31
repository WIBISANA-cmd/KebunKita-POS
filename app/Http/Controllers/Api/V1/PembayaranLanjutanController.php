<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Pembayaran\GatewayAdapterInterface;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PembayaranLanjutanController extends Controller
{
    public function __construct(
        protected GatewayAdapterInterface $gatewayAdapter
    ) {}

    public function inisialisasiQris(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nomor_invoice' => 'required|string',
            'total_rp' => 'required|numeric|min:1',
            'nama_pelanggan' => 'nullable|string',
        ]);

        $hasil = $this->gatewayAdapter->inisialisasi(
            $validated['nomor_invoice'],
            (string) $validated['total_rp'],
            ['nama' => $validated['nama_pelanggan'] ?? 'Pelanggan']
        );

        return ResponsApi::sukses($hasil, 'Inisialisasi gateway pembayaran.');
    }
}

