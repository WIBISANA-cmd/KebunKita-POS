<?php

namespace App\Services\Persediaan;

use App\Models\DokumenStok;
use App\Models\LotStok;
use App\Models\MutasiStok;
use App\Models\SaldoStok;
use App\Support\Qty;
use App\Support\Uang;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StokService
{
    /**
     * Alokasi pengeluaran stok fisik berdasarkan FEFO (First Expired, First Out)
     * dengan row-locking FOR UPDATE yang konsisten untuk mencegah race condition.
     */
    public function alokasikanFefo(
        string $produkId,
        string $lokasiStokId,
        string $qtyDibutuhkanDasar,
        DokumenStok $dokumenStok,
        string $keterangan = 'Pengeluaran stok'
    ): array {
        // 1. Lock saldo_stok untuk produk dan lokasi ini
        $saldo = SaldoStok::where('produk_id', $produkId)
            ->where('lokasi_stok_id', $lokasiStokId)
            ->lockForUpdate()
            ->first();

        $saldoTersedia = $saldo ? $saldo->qty_dasar : '0.000';

        if (Qty::bandingkan($saldoTersedia, $qtyDibutuhkanDasar) < 0) {
            throw ValidationException::withMessages([
                'stok' => ["Stok tidak mencukupi untuk produk ID {$produkId}. Tersedia: {$saldoTersedia}, Diminta: {$qtyDibutuhkanDasar}"],
            ]);
        }

        // 2. Lock lot_stok aktif berdasarkan urutan kedaluwarsa (FEFO) lalu tanggal terima (FIFO)
        $lots = LotStok::where('produk_id', $produkId)
            ->where('lokasi_stok_id', $lokasiStokId)
            ->where('qty_sisa', '>', 0)
            ->orderByRaw('kedaluwarsa_pada ASC NULLS LAST')
            ->orderBy('created_at', 'asc')
            ->lockForUpdate()
            ->get();

        $sisaDibutuhkan = $qtyDibutuhkanDasar;
        $alokasiHasil = [];

        foreach ($lots as $lot) {
            if (! Qty::lebihDariNol($sisaDibutuhkan)) {
                break;
            }

            // Berapa yang bisa diambil dari lot ini
            $bisaDiambil = Qty::bandingkan($lot->qty_sisa, $sisaDibutuhkan) >= 0
                ? $sisaDibutuhkan
                : $lot->qty_sisa;

            // Kurangi qty_sisa lot
            $lot->qty_sisa = Qty::kurang($lot->qty_sisa, $bisaDiambil);
            $lot->save();

            // Hitung nilai HPP alokasi
            $nilaiHppRp = Uang::kali($bisaDiambil, (int) round((float) $lot->hpp_dasar));

            // Catat ledger mutasi stok immutable (-)
            MutasiStok::create([
                'dokumen_stok_id' => $dokumenStok->id,
                'produk_id' => $produkId,
                'lokasi_stok_id' => $lokasiStokId,
                'lot_stok_id' => $lot->id,
                'qty_delta' => '-' . $bisaDiambil,
                'nilai_hpp_rp' => $nilaiHppRp,
                'keterangan' => $keterangan,
            ]);

            $alokasiHasil[] = [
                'lot_stok_id' => $lot->id,
                'qty_dasar' => $bisaDiambil,
                'hpp_rp' => $nilaiHppRp,
                'hpp_dasar' => $lot->hpp_dasar,
                'kode_lot' => $lot->kode_lot,
            ];

            $sisaDibutuhkan = Qty::kurang($sisaDibutuhkan, $bisaDiambil);
        }

        if (Qty::lebihDariNol($sisaDibutuhkan)) {
            throw ValidationException::withMessages([
                'stok' => ["Terjadi ketidaksesuaian lot stok untuk produk ID {$produkId}. Silakan lakukan opname stok."],
            ]);
        }

        // 3. Update saldo_stok terpelihara
        $saldo->qty_dasar = Qty::kurang($saldo->qty_dasar, $qtyDibutuhkanDasar);
        $saldo->save();

        return $alokasiHasil;
    }

    /**
     * Tambah stok ke lot baru dan perbarui saldo serta catat ledger (+).
     */
    public function tambahStokLot(
        string $produkId,
        string $lokasiStokId,
        string $qtyDasar,
        string $hppDasar,
        DokumenStok $dokumenStok,
        string $kodeLot,
        ?string $kedaluwarsaPada = null,
        ?string $itemTerimaId = null,
        string $keterangan = 'Penerimaan stok'
    ): LotStok {
        $lot = LotStok::create([
            'produk_id' => $produkId,
            'lokasi_stok_id' => $lokasiStokId,
            'item_terima_id' => $itemTerimaId,
            'kode_lot' => $kodeLot,
            'qty_awal' => $qtyDasar,
            'qty_sisa' => $qtyDasar,
            'hpp_dasar' => $hppDasar,
            'kedaluwarsa_pada' => $kedaluwarsaPada,
        ]);

        $nilaiHppTotal = Uang::kali($qtyDasar, (int) round((float) $hppDasar));

        MutasiStok::create([
            'dokumen_stok_id' => $dokumenStok->id,
            'produk_id' => $produkId,
            'lokasi_stok_id' => $lokasiStokId,
            'lot_stok_id' => $lot->id,
            'qty_delta' => $qtyDasar,
            'nilai_hpp_rp' => $nilaiHppTotal,
            'keterangan' => $keterangan,
        ]);

        // Perbarui saldo terpelihara
        $saldo = SaldoStok::firstOrCreate(
            ['produk_id' => $produkId, 'lokasi_stok_id' => $lokasiStokId],
            ['qty_dasar' => '0.000']
        );
        $saldo->qty_dasar = Qty::tambah($saldo->qty_dasar, $qtyDasar);
        $saldo->save();

        return $lot;
    }

    /**
     * Ambil riwayat kartu stok / mutasi.
     */
    public function riwayatMutasi(?string $produkId = null, ?string $lokasiStokId = null, int $perHalaman = 20): LengthAwarePaginator
    {
        $query = MutasiStok::with(['dokumen', 'produk.satuanDasar', 'lokasi', 'lot'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        if ($produkId) {
            $query->where('produk_id', $produkId);
        }

        if ($lokasiStokId) {
            $query->where('lokasi_stok_id', $lokasiStokId);
        }

        return $query->paginate($perHalaman);
    }
}

