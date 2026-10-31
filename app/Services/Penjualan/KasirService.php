<?php

namespace App\Services\Penjualan;

use App\Models\AlokasiJualLot;
use App\Models\BayarJual;
use App\Models\DokumenStok;
use App\Models\ItemJual;
use App\Models\LokasiStok;
use App\Models\MetodeBayar;
use App\Models\MutasiKas;
use App\Models\Penjualan;
use App\Models\Produk;
use App\Models\SatuanProduk;
use App\Models\ShiftKasir;
use App\Services\Persediaan\StokService;
use App\Services\Produk\HargaService;
use App\Support\NomorDokumen;
use App\Support\Qty;
use App\Support\Uang;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KasirService
{
    public function __construct(
        protected StokService $stokService,
        protected HargaService $hargaService,
        protected ShiftKasirService $shiftKasirService
    ) {}

    /**
     * Selesaikan transaksi penjualan POS kasir.
     */
    public function selesaikanPenjualan(array $data, string $cabangId, string $penggunaId): Penjualan
    {
        // 1. Verifikasi shift kasir aktif
        $shift = $this->shiftKasirService->ambilShiftAktif($cabangId, $penggunaId);
        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => ['Shift kasir belum dibuka. Buka shift kasir terlebih dahulu sebelum memproses transaksi.'],
            ]);
        }

        // 2. Cegah duplikasi transaksi melalui idempotency_key jika dikirimkan
        $idempotencyKey = $data['idempotency_key'] ?? null;
        if ($idempotencyKey) {
            $transaksiLama = Penjualan::where('idempotency_key', $idempotencyKey)->first();
            if ($transaksiLama) {
                return $transaksiLama->load(['items.produk', 'pembayaran.metodeBayar', 'pelanggan']);
            }
        }

        $items = $data['items'] ?? [];
        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => ['Keranjang belanja tidak boleh kosong.'],
            ]);
        }

        $pembayaranInput = $data['pembayaran'] ?? [];
        if (empty($pembayaranInput)) {
            throw ValidationException::withMessages([
                'pembayaran' => ['Pilih minimal satu metode pembayaran.'],
            ]);
        }

        return DB::transaction(function () use ($data, $cabangId, $penggunaId, $shift, $items, $pembayaranInput, $idempotencyKey) {
            // Dapatkan atau buat lokasi stok rak toko kasir untuk cabang ini
            $lokasiStok = LokasiStok::firstOrCreate(
                ['cabang_id' => $cabangId, 'kode' => 'TOKO-UTAMA'],
                ['nama' => 'Rak Penjualan Kasir', 'tipe' => 'rak_toko']
            );

            // Generate nomor nota penjualan
            $nomorNota = NomorDokumen::buat('PJ', 'penjualan', 'nomor');

            // Buat dokumen stok induk
            $dokumenStok = DokumenStok::create([
                'cabang_id' => $cabangId,
                'jenis' => 'penjualan',
                'nomor' => 'STK-' . $nomorNota,
                'referensi_id' => $nomorNota,
                'waktu_posting' => now(),
            ]);

            $subtotalRp = '0';
            $totalDiskonItemRp = '0';
            $hppTotalRp = '0';
            $itemJualSiapSimpan = [];

            // Proses setiap item
            foreach ($items as $item) {
                $produkId = $item['produk_id'];
                $satuanProdukId = $item['satuan_produk_id'];
                $qty = Qty::bersihkan($item['qty'] ?? '1');
                $diskonItemRp = Uang::bersihkan($item['diskon_rp'] ?? '0');

                $produk = Produk::with('satuanDasar')->findOrFail($produkId);
                $satuanProduk = SatuanProduk::with('satuan')->findOrFail($satuanProdukId);

                // Resolusi harga jual aktif di cabang untuk satuan produk ini
                $hargaAktif = $this->hargaService->ambilHargaAktif($satuanProdukId, $cabangId);
                $hargaSatuanRp = $hargaAktif ? $hargaAktif->harga_rp : ($satuanProduk->harga_jual_default ?? '0');

                // Jika harga ada di input dan valid, gunakan harga resmi sistem
                $hargaSnapshotRp = $hargaSatuanRp;

                // Total per item = (harga * qty) - diskon
                $totalKotorItemRp = Uang::kali($hargaSnapshotRp, (float) $qty);
                $totalBersihItemRp = Uang::kurang($totalKotorItemRp, $diskonItemRp);

                $subtotalRp = Uang::tambah($subtotalRp, $totalKotorItemRp);
                $totalDiskonItemRp = Uang::tambah($totalDiskonItemRp, $diskonItemRp);

                // Hitung QTY dasar untuk alokasi stok FEFO
                $qtyDasar = Qty::keSatuanDasar($qty, $satuanProduk->faktor_ke_dasar ?? '1.000000');

                // Alokasikan stok dari lot secara FEFO
                $alokasiList = $this->stokService->alokasikanFefo(
                    $produkId,
                    $lokasiStok->id,
                    $qtyDasar,
                    $dokumenStok,
                    "Penjualan POS nota {$nomorNota}"
                );

                $hppItemRp = '0';
                foreach ($alokasiList as $alokasi) {
                    $hppItemRp = Uang::tambah($hppItemRp, $alokasi['hpp_rp']);
                }
                $hppTotalRp = Uang::tambah($hppTotalRp, $hppItemRp);

                $itemJualSiapSimpan[] = [
                    'produk_id' => $produkId,
                    'satuan_produk_id' => $satuanProdukId,
                    'nama_snapshot' => $produk->nama,
                    'satuan_snapshot' => $satuanProduk->satuan->nama ?? 'Pcs',
                    'qty' => $qty,
                    'harga_snapshot_rp' => $hargaSnapshotRp,
                    'diskon_rp' => $diskonItemRp,
                    'total_rp' => $totalBersihItemRp,
                    'hpp_rp' => $hppItemRp,
                    'alokasi' => $alokasiList,
                ];
            }

            // Hitung total final penjualan
            $diskonNotaTambahanRp = Uang::bersihkan($data['diskon_rp'] ?? '0');
            $totalDiskonSemuaRp = Uang::tambah($totalDiskonItemRp, $diskonNotaTambahanRp);
            $pajakRp = Uang::bersihkan($data['pajak_rp'] ?? '0');

            $totalHarusDibayarRp = Uang::tambah(
                Uang::kurang($subtotalRp, $totalDiskonSemuaRp),
                $pajakRp
            );

            // Validasi kelayakan pembayaran
            $totalDibayarRp = '0';
            $pembayaranRecords = [];
            $totalKembalianSemuaRp = '0';
            $totalTunaiDiterimaRp = '0';
            $totalTunaiNilaiRp = '0';

            foreach ($pembayaranInput as $bayar) {
                $metodeBayar = MetodeBayar::findOrFail($bayar['metode_bayar_id']);
                $nilaiBayarRp = Uang::bersihkan($bayar['nilai_rp']);
                $diterimaRp = Uang::bersihkan($bayar['diterima_rp'] ?? $nilaiBayarRp);

                $kembalianItemRp = '0';
                if ($metodeBayar->jenis === 'tunai') {
                    if (Uang::bandingkan($diterimaRp, $nilaiBayarRp) < 0) {
                        throw ValidationException::withMessages([
                            'pembayaran' => ['Nominal uang tunai yang diterima kurang dari nilai bayar.'],
                        ]);
                    }
                    $kembalianItemRp = Uang::kurang($diterimaRp, $nilaiBayarRp);
                    $totalKembalianSemuaRp = Uang::tambah($totalKembalianSemuaRp, $kembalianItemRp);
                    $totalTunaiDiterimaRp = Uang::tambah($totalTunaiDiterimaRp, $diterimaRp);
                    $totalTunaiNilaiRp = Uang::tambah($totalTunaiNilaiRp, $nilaiBayarRp);
                }

                $totalDibayarRp = Uang::tambah($totalDibayarRp, $nilaiBayarRp);

                $pembayaranRecords[] = [
                    'metode_bayar_id' => $metodeBayar->id,
                    'nilai_rp' => $nilaiBayarRp,
                    'diterima_rp' => $diterimaRp,
                    'kembalian_rp' => $kembalianItemRp,
                    'status' => 'sukses',
                    'ref_eksternal' => $bayar['ref_eksternal'] ?? null,
                ];
            }

            if (Uang::bandingkan($totalDibayarRp, $totalHarusDibayarRp) < 0) {
                throw ValidationException::withMessages([
                    'pembayaran' => ["Total pembayaran ({$totalDibayarRp}) kurang dari total tagihan ({$totalHarusDibayarRp})."],
                ]);
            }

            // Simpan Dokumen Penjualan
            $penjualan = Penjualan::create([
                'cabang_id' => $cabangId,
                'shift_kasir_id' => $shift->id,
                'pelanggan_id' => $data['pelanggan_id'] ?? null,
                'nomor' => $nomorNota,
                'waktu_penjualan' => now(),
                'status' => 'selesai',
                'tipe_pesanan' => $data['tipe_pesanan'] ?? 'take_away',
                'subtotal_rp' => $subtotalRp,
                'diskon_rp' => $totalDiskonSemuaRp,
                'pajak_rp' => $pajakRp,
                'total_rp' => $totalHarusDibayarRp,
                'hpp_total_rp' => $hppTotalRp,
                'idempotency_key' => $idempotencyKey,
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Simpan Item Jual & Catat Alokasi Lot
            foreach ($itemJualSiapSimpan as $itemRow) {
                $itemJual = ItemJual::create([
                    'penjualan_id' => $penjualan->id,
                    'produk_id' => $itemRow['produk_id'],
                    'satuan_produk_id' => $itemRow['satuan_produk_id'],
                    'nama_snapshot' => $itemRow['nama_snapshot'],
                    'satuan_snapshot' => $itemRow['satuan_snapshot'],
                    'qty' => $itemRow['qty'],
                    'harga_snapshot_rp' => $itemRow['harga_snapshot_rp'],
                    'diskon_rp' => $itemRow['diskon_rp'],
                    'total_rp' => $itemRow['total_rp'],
                    'hpp_rp' => $itemRow['hpp_rp'],
                ]);

                foreach ($itemRow['alokasi'] as $alokasi) {
                    AlokasiJualLot::create([
                        'item_jual_id' => $itemJual->id,
                        'lot_stok_id' => $alokasi['lot_stok_id'],
                        'qty_dasar' => $alokasi['qty_dasar'],
                        'hpp_rp' => $alokasi['hpp_rp'],
                    ]);
                }
            }

            // Simpan Bayar Jual
            foreach ($pembayaranRecords as $pRecord) {
                BayarJual::create([
                    'penjualan_id' => $penjualan->id,
                    'metode_bayar_id' => $pRecord['metode_bayar_id'],
                    'nilai_rp' => $pRecord['nilai_rp'],
                    'diterima_rp' => $pRecord['diterima_rp'],
                    'kembalian_rp' => $pRecord['kembalian_rp'],
                    'status' => $pRecord['status'],
                    'ref_eksternal' => $pRecord['ref_eksternal'],
                ]);
            }

            // Catat Mutasi Kas laci jika ada komponen pembayaran tunai
            if (Uang::lebihDariNol($totalTunaiNilaiRp)) {
                MutasiKas::create([
                    'shift_kasir_id' => $shift->id,
                    'jenis' => 'penjualan_tunai',
                    'masuk_rp' => $totalTunaiNilaiRp,
                    'keluar_rp' => '0',
                    'nomor_ref' => $penjualan->nomor,
                    'keterangan' => "Penjualan tunai nota {$penjualan->nomor}",
                ]);

                // Update saldo sistem shift kasir
                $shift->saldo_sistem_rp = Uang::tambah($shift->saldo_sistem_rp, $totalTunaiNilaiRp);
                $shift->save();
            }

            return $penjualan->fresh([
                'cabang',
                'shiftKasir.pengguna',
                'pelanggan',
                'items.produk',
                'items.satuanProduk',
                'pembayaran.metodeBayar',
            ]);
        });
    }

    /**
     * Daftar riwayat penjualan dengan pagination & filter.
     */
    public function daftarPenjualan(string $cabangId, array $filter = []): LengthAwarePaginator
    {
        $query = Penjualan::with(['pelanggan', 'pembayaran.metodeBayar', 'shiftKasir.pengguna'])
            ->where('cabang_id', $cabangId);

        if (! empty($filter['cari'])) {
            $cari = $filter['cari'];
            $query->where(function ($q) use ($cari) {
                $q->where('nomor', 'ilike', "%{$cari}%")
                    ->orWhereHas('pelanggan', function ($qp) use ($cari) {
                        $qp->where('nama', 'ilike', "%{$cari}%");
                    });
            });
        }

        if (! empty($filter['status'])) {
            $query->where('status', $filter['status']);
        }

        if (! empty($filter['tanggal_awal'])) {
            $query->whereDate('waktu_penjualan', '>=', $filter['tanggal_awal']);
        }

        if (! empty($filter['tanggal_akhir'])) {
            $query->whereDate('waktu_penjualan', '<=', $filter['tanggal_akhir']);
        }

        return $query->orderBy('waktu_penjualan', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($filter['per_page'] ?? 15);
    }

    /**
     * Detail lengkap penjualan untuk cetak nota.
     */
    public function ambilDetailNota(string $id, string $cabangId): Penjualan
    {
        return Penjualan::with([
            'cabang',
            'shiftKasir.pengguna',
            'pelanggan',
            'items.produk',
            'items.satuanProduk.satuan',
            'pembayaran.metodeBayar',
        ])
            ->where('cabang_id', $cabangId)
            ->findOrFail($id);
    }
}

