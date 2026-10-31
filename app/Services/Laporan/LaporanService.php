<?php

namespace App\Services\Laporan;

use App\Models\Penjualan;
use App\Models\ReturJual;
use App\Models\ItemSusut;
use App\Models\MutasiStok;
use App\Support\Uang;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanService
{
    /**
     * Laporan transaksi penjualan berfilter tanggal.
     */
    public function laporanPenjualan(string $cabangId, array $filter = []): LengthAwarePaginator
    {
        $query = Penjualan::with(['pelanggan', 'pembayaran.metodeBayar', 'shiftKasir.pengguna'])
            ->where('cabang_id', $cabangId);

        if (! empty($filter['tanggal_awal'])) {
            $query->whereDate('waktu_penjualan', '>=', $filter['tanggal_awal']);
        }
        if (! empty($filter['tanggal_akhir'])) {
            $query->whereDate('waktu_penjualan', '<=', $filter['tanggal_akhir']);
        }
        if (! empty($filter['status'])) {
            $query->where('status', $filter['status']);
        }

        return $query->orderBy('waktu_penjualan', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($filter['per_page'] ?? 20);
    }

    /**
     * Laporan Laba Rugi Komprehensif Cabang berdasarkan rentang tanggal.
     */
    public function laporanLabaRugi(string $cabangId, string $tanggalAwal, string $tanggalAkhir): array
    {
        // 1. Total Penjualan Kotor
        $penjualanQuery = Penjualan::where('cabang_id', $cabangId)
            ->whereDate('waktu_penjualan', '>=', $tanggalAwal)
            ->whereDate('waktu_penjualan', '<=', $tanggalAkhir)
            ->whereIn('status', ['selesai', 'retur_sebagian', 'retur_penuh']);

        $subtotalKotorRp = (string) $penjualanQuery->sum('subtotal_rp');
        $diskonNotaRp = (string) $penjualanQuery->sum('diskon_rp');
        $pajakRp = (string) $penjualanQuery->sum('pajak_rp');
        $hppTotalRp = (string) $penjualanQuery->sum('hpp_total_rp');

        // 2. Retur & Pengembalian Dana
        $totalReturRp = (string) ReturJual::where('cabang_id', $cabangId)
            ->whereDate('waktu_retur', '>=', $tanggalAwal)
            ->whereDate('waktu_retur', '<=', $tanggalAkhir)
            ->where('status', 'selesai')
            ->sum('total_refund_rp');

        // 3. Biaya Susut Sayur & Buah Rusak/Kadaluwarsa
        $totalBiayaSusutRp = (string) ItemSusut::whereHas('susut', fn ($q) => $q
                ->where('cabang_id', $cabangId)
                ->whereDate('created_at', '>=', $tanggalAwal)
                ->whereDate('created_at', '<=', $tanggalAkhir)
                ->where('status', 'diposting'))
            ->sum('nilai_hpp_rp');

        // Kalkulasi:
        // Penjualan Bersih = Subtotal Kotor - Diskon - Retur
        $penjualanBersihRp = Uang::kurang(
            Uang::kurang($subtotalKotorRp, $diskonNotaRp),
            $totalReturRp
        );

        // Laba Kotor = Penjualan Bersih - HPP Total
        $labaKotorRp = Uang::kurang($penjualanBersihRp, $hppTotalRp);

        // Laba Bersih Operasional = Laba Kotor - Biaya Susut Sayur
        $labaBersihRp = Uang::kurang($labaKotorRp, $totalBiayaSusutRp);

        $marginLabaBersihPersen = (float) $penjualanBersihRp > 0
            ? round(((float) $labaBersihRp / (float) $penjualanBersihRp) * 100, 2)
            : 0;

        return [
            'periode' => [
                'tanggal_awal' => $tanggalAwal,
                'tanggal_akhir' => $tanggalAkhir,
            ],
            'pendapatan' => [
                'penjualan_kotor_rp' => $subtotalKotorRp,
                'diskon_penjualan_rp' => $diskonNotaRp,
                'retur_penjualan_rp' => $totalReturRp,
                'penjualan_bersih_rp' => $penjualanBersihRp,
                'pajak_dikumpulkan_rp' => $pajakRp,
            ],
            'harga_pokok_penjualan' => [
                'hpp_aktual_fefo_rp' => $hppTotalRp,
            ],
            'laba_kotor_rp' => $labaKotorRp,
            'beban_operasional' => [
                'biaya_susut_sayur_rp' => $totalBiayaSusutRp,
            ],
            'laba_bersih_rp' => $labaBersihRp,
            'margin_bersih_persen' => $marginLabaBersihPersen,
        ];
    }

    /**
     * Ekspor CSV Penjualan aman memori (Streaming).
     */
    public function eksporCsvPenjualan(string $cabangId, string $tanggalAwal, string $tanggalAkhir): StreamedResponse
    {
        $namaFile = "laporan-penjualan-{$tanggalAwal}-sd-{$tanggalAkhir}.csv";

        return response()->streamDownload(function () use ($cabangId, $tanggalAwal, $tanggalAkhir) {
            $handle = fopen('php://output', 'w');
            // Menulis UTF-8 BOM agar Excel menampilkan aksen & mata uang dengan benar
            fputs($handle, "\xEF\xBB\xBF");

            // Header Kolom CSV
            fputcsv($handle, [
                'Nomor Nota',
                'Waktu Transaksi',
                'Status',
                'Tipe Pesanan',
                'Pelanggan',
                'Kasir',
                'Subtotal (Rp)',
                'Diskon (Rp)',
                'Pajak (Rp)',
                'Total Akhir (Rp)',
                'HPP Total (Rp)',
                'Metode Pembayaran',
            ]);

            $query = Penjualan::with(['pelanggan', 'pembayaran.metodeBayar', 'shiftKasir.pengguna'])
                ->where('cabang_id', $cabangId)
                ->whereDate('waktu_penjualan', '>=', $tanggalAwal)
                ->whereDate('waktu_penjualan', '<=', $tanggalAkhir)
                ->orderBy('waktu_penjualan', 'asc');

            $query->chunk(200, function ($daftarPenjualan) use ($handle) {
                foreach ($daftarPenjualan as $p) {
                    $metodeList = $p->pembayaran->map(fn($b) => $b->metodeBayar?->nama ?? 'Tunai')->join(', ');

                    fputcsv($handle, [
                        $p->nomor,
                        $p->waktu_penjualan->format('Y-m-d H:i:s'),
                        $p->status,
                        $p->tipe_pesanan,
                        $p->pelanggan?->nama ?? 'Pelanggan Umum',
                        $p->shiftKasir?->pengguna?->nama ?? '-',
                        $p->subtotal_rp,
                        $p->diskon_rp,
                        $p->pajak_rp,
                        $p->total_rp,
                        $p->hpp_total_rp,
                        $metodeList,
                    ]);
                }
            });

            fclose($handle);
        }, $namaFile, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$namaFile}\"",
        ]);
    }
}

