<?php

namespace App\Services\MultiCabang;

use App\Models\DokumenStok;
use App\Models\ItemTransfer;
use App\Models\LokasiStok;
use App\Models\LotStok;
use App\Models\MutasiStok;
use App\Models\SaldoStok;
use App\Models\SatuanProduk;
use App\Models\TransferStok;
use App\Services\Persediaan\StokService;
use App\Support\NomorDokumen;
use App\Support\Qty;
use App\Support\Uang;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransferStokService
{
    public function __construct(
        protected StokService $stokService
    ) {}

    /**
     * Kirim transfer stok dari cabang asal ke cabang tujuan.
     */
    public function kirimTransfer(
        string $cabangAsalId,
        string $cabangTujuanId,
        string $pengirimId,
        array $items,
        ?string $catatan = null
    ): TransferStok {
        if ($cabangAsalId === $cabangTujuanId) {
            throw ValidationException::withMessages([
                'cabang' => ['Cabang asal dan cabang tujuan tidak boleh sama.'],
            ]);
        }

        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => ['Pilih minimal satu produk untuk ditransfer.'],
            ]);
        }

        return DB::transaction(function () use ($cabangAsalId, $cabangTujuanId, $pengirimId, $items, $catatan) {
            $nomorTransfer = NomorDokumen::buat('TF', 'transfer_stok', 'nomor');

            // Ambil lokasi rak toko asal
            $lokasiAsal = LokasiStok::firstOrCreate(
                ['cabang_id' => $cabangAsalId, 'kode' => 'TOKO-UTAMA'],
                ['nama' => 'Rak Penjualan Kasir', 'tipe' => 'rak_toko']
            );

            // Buat dokumen stok pengeluaran
            $dokumenStokKeluar = DokumenStok::create([
                'cabang_id' => $cabangAsalId,
                'jenis' => 'transfer_keluar',
                'nomor' => 'STK-' . $nomorTransfer,
                'referensi_id' => $nomorTransfer,
                'waktu_posting' => now(),
            ]);

            $transfer = TransferStok::create([
                'cabang_asal_id' => $cabangAsalId,
                'cabang_tujuan_id' => $cabangTujuanId,
                'pengirim_id' => $pengirimId,
                'nomor' => $nomorTransfer,
                'waktu_kirim' => now(),
                'status' => 'dikirim',
                'catatan' => $catatan,
            ]);

            foreach ($items as $item) {
                $produkId = $item['produk_id'];
                $satuanProdukId = $item['satuan_produk_id'];
                $qtyKirim = Qty::bersihkan($item['qty_kirim']);

                $satuanProduk = SatuanProduk::findOrFail($satuanProdukId);
                $qtyDasar = Qty::kali($qtyKirim, $satuanProduk->faktor_konversi ?? '1');

                // Alokasikan stok FEFO dari cabang asal
                $alokasiList = $this->stokService->alokasikanFefo(
                    $produkId,
                    $lokasiAsal->id,
                    $qtyDasar,
                    $dokumenStokKeluar,
                    "Pengiriman transfer stok {$nomorTransfer}"
                );

                $hppRata2 = '0';
                $totalHppRp = '0';
                foreach ($alokasiList as $alokasi) {
                    $totalHppRp = Uang::tambah($totalHppRp, $alokasi['hpp_rp']);
                }
                if (Qty::lebihDariNol($qtyKirim)) {
                    $hppRata2 = (string) round((float) $totalHppRp / (float) $qtyKirim, 6);
                }

                ItemTransfer::create([
                    'transfer_stok_id' => $transfer->id,
                    'produk_id' => $produkId,
                    'satuan_produk_id' => $satuanProdukId,
                    'qty_kirim' => $qtyKirim,
                    'qty_terima' => null,
                    'hpp_satuan_rp' => $hppRata2,
                ]);
            }

            return $transfer->fresh(['cabangAsal', 'cabangTujuan', 'pengirim', 'items.produk', 'items.satuanProduk.satuan']);
        });
    }

    /**
     * Konfirmasi penerimaan transfer stok di cabang tujuan.
     */
    public function terimaTransfer(
        string $transferId,
        string $cabangTujuanId,
        string $penerimaId,
        array $itemsTerima
    ): TransferStok {
        $transfer = TransferStok::with('items')->where('cabang_tujuan_id', $cabangTujuanId)->findOrFail($transferId);

        if ($transfer->status !== 'dikirim') {
            throw ValidationException::withMessages([
                'transfer' => ["Transfer stok ini tidak dapat diterima karena berstatus '{$transfer->status}'."],
            ]);
        }

        return DB::transaction(function () use ($transfer, $cabangTujuanId, $penerimaId, $itemsTerima) {
            // Ambil lokasi rak toko tujuan
            $lokasiTujuan = LokasiStok::firstOrCreate(
                ['cabang_id' => $cabangTujuanId, 'kode' => 'TOKO-UTAMA'],
                ['nama' => 'Rak Penjualan Kasir', 'tipe' => 'rak_toko']
            );

            // Buat dokumen stok penerimaan
            $dokumenStokMasuk = DokumenStok::create([
                'cabang_id' => $cabangTujuanId,
                'jenis' => 'transfer_masuk',
                'nomor' => 'STK-IN-' . $transfer->nomor,
                'referensi_id' => $transfer->nomor,
                'waktu_posting' => now(),
            ]);

            foreach ($itemsTerima as $itTerima) {
                $itemTransferId = $itTerima['item_transfer_id'];
                $qtyDiterima = Qty::bersihkan($itTerima['qty_terima']);

                $itemTransfer = ItemTransfer::with('satuanProduk')->where('transfer_stok_id', $transfer->id)->findOrFail($itemTransferId);
                $itemTransfer->qty_terima = $qtyDiterima;
                $itemTransfer->save();

                $qtyDasarTerima = Qty::kali($qtyDiterima, $itemTransfer->satuanProduk->faktor_konversi ?? '1');

                // Tambah saldo stok cabang tujuan
                $saldo = SaldoStok::firstOrCreate(
                    ['produk_id' => $itemTransfer->produk_id, 'lokasi_stok_id' => $lokasiTujuan->id],
                    ['qty_dasar' => '0']
                );
                $saldo->qty_dasar = Qty::tambah($saldo->qty_dasar, $qtyDasarTerima);
                $saldo->save();

                // Buat lot stok baru di cabang tujuan
                $lotMasuk = LotStok::create([
                    'produk_id' => $itemTransfer->produk_id,
                    'lokasi_stok_id' => $lokasiTujuan->id,
                    'item_terima_id' => null,
                    'kode_lot' => 'LOT-TF-' . strtoupper(uniqid()),
                    'qty_awal' => $qtyDasarTerima,
                    'qty_sisa' => $qtyDasarTerima,
                    'hpp_dasar' => $itemTransfer->hpp_satuan_rp,
                    'kedaluwarsa_pada' => null,
                ]);

                // Ledger mutasi stok masuk (+)
                MutasiStok::create([
                    'dokumen_stok_id' => $dokumenStokMasuk->id,
                    'produk_id' => $itemTransfer->produk_id,
                    'lokasi_stok_id' => $lokasiTujuan->id,
                    'lot_stok_id' => $lotMasuk->id,
                    'qty_delta' => '+' . $qtyDasarTerima,
                    'nilai_hpp_rp' => Uang::kali($itemTransfer->hpp_satuan_rp, (float) $qtyDiterima),
                    'keterangan' => "Penerimaan transfer stok dari {$transfer->cabangAsal->nama} nota {$transfer->nomor}",
                ]);
            }

            $transfer->update([
                'waktu_terima' => now(),
                'penerima_id' => $penerimaId,
                'status' => 'diterima',
            ]);

            return $transfer->fresh(['cabangAsal', 'cabangTujuan', 'pengirim', 'penerima', 'items.produk']);
        });
    }

    /**
     * Riwayat transfer stok cabang (baik kirim maupun terima).
     */
    public function daftarTransfer(string $cabangId, array $filter = []): LengthAwarePaginator
    {
        $query = TransferStok::with(['cabangAsal', 'cabangTujuan', 'pengirim', 'penerima', 'items.produk'])
            ->where(function ($q) use ($cabangId) {
                $q->where('cabang_asal_id', $cabangId)
                    ->orWhere('cabang_tujuan_id', $cabangId);
            });

        if (! empty($filter['status'])) {
            $query->where('status', $filter['status']);
        }

        return $query->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($filter['per_page'] ?? 15);
    }
}

