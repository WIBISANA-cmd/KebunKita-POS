<?php

namespace App\Services\Penjualan;

use App\Models\DokumenStok;
use App\Models\ItemJual;
use App\Models\ItemRetur;
use App\Models\ItemSusut;
use App\Models\LokasiStok;
use App\Models\LotStok;
use App\Models\MetodeBayar;
use App\Models\MutasiKas;
use App\Models\MutasiStok;
use App\Models\Penjualan;
use App\Models\RefundBayar;
use App\Models\ReturJual;
use App\Models\SaldoStok;
use App\Models\SusutStok;
use App\Support\NomorDokumen;
use App\Support\Qty;
use App\Support\Uang;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturJualService
{
    public function __construct(
        protected ShiftKasirService $shiftKasirService
    ) {}

    /**
     * Proses transaksi retur penjualan dan pengembalian dana (refund).
     */
    public function prosesRetur(array $data, string $cabangId, string $penggunaId): ReturJual
    {
        $penjualanId = $data['penjualan_id'];
        $penjualan = Penjualan::with(['items', 'pembayaran.metodeBayar'])->where('cabang_id', $cabangId)->findOrFail($penjualanId);

        if (! in_array($penjualan->status, ['selesai', 'retur_sebagian'])) {
            throw ValidationException::withMessages([
                'penjualan' => ["Transaksi penjualan dengan status '{$penjualan->status}' tidak dapat diretur."],
            ]);
        }

        $itemsReturInput = $data['items'] ?? [];
        if (empty($itemsReturInput)) {
            throw ValidationException::withMessages([
                'items' => ['Pilih minimal satu item yang akan diretur.'],
            ]);
        }

        $refundsInput = $data['refunds'] ?? [];
        if (empty($refundsInput)) {
            throw ValidationException::withMessages([
                'refunds' => ['Tentukan metode pengembalian dana (refund).'],
            ]);
        }

        return DB::transaction(function () use ($data, $penjualan, $cabangId, $penggunaId, $itemsReturInput, $refundsInput) {
            $nomorRetur = NomorDokumen::buat('RT', 'retur_jual', 'nomor');

            // Cek apakah ada shift kasir aktif jika ada pengembalian tunai
            $shiftKasir = $this->shiftKasirService->ambilShiftAktif($cabangId, $penggunaId);

            // Validasi & Hitung Nilai Retur Item
            $totalRefundHitungRp = '0';
            $itemReturSiapSimpan = [];

            // Ambil lokasi rak toko untuk pengembalian stok layak jual
            $lokasiToko = LokasiStok::firstOrCreate(
                ['cabang_id' => $cabangId, 'kode' => 'TOKO-UTAMA'],
                ['nama' => 'Rak Penjualan Kasir', 'tipe' => 'rak_toko']
            );

            // Buat dokumen stok untuk pencatatan retur
            $dokumenStok = DokumenStok::create([
                'cabang_id' => $cabangId,
                'jenis' => 'retur_jual',
                'nomor' => 'STK-' . $nomorRetur,
                'referensi_id' => $nomorRetur,
                'waktu_posting' => now(),
            ]);

            // Buat dokumen susut jika ada item yang rusak/tidak layak jual
            $dokumenSusut = null;

            foreach ($itemsReturInput as $it) {
                $itemJualId = $it['item_jual_id'];
                $qtyRetur = Qty::bersihkan($it['qty']);
                $layakJual = (bool) ($it['layak_jual'] ?? true);
                $keteranganKondisi = $it['keterangan_kondisi'] ?? null;

                $itemJual = ItemJual::with('satuanProduk')->where('penjualan_id', $penjualan->id)->findOrFail($itemJualId);

                // Cek kuantitas yang sudah diretur sebelumnya
                $qtySudahDiretur = ItemRetur::where('item_jual_id', $itemJual->id)->sum('qty');
                $qtyMaksimalRetur = Qty::kurang($itemJual->qty, (string) $qtySudahDiretur);

                if (Qty::bandingkan($qtyRetur, $qtyMaksimalRetur) > 0) {
                    throw ValidationException::withMessages([
                        'items' => ["Kuantitas retur untuk {$itemJual->nama_snapshot} melebihi sisa yang dapat diretur. Maksimal: {$qtyMaksimalRetur}"],
                    ]);
                }

                // Hitung nilai refund proporsional
                $hargaSatuanRp = $itemJual->harga_snapshot_rp;
                $nilaiRefundItemRp = Uang::kali($hargaSatuanRp, (float) $qtyRetur);
                $totalRefundHitungRp = Uang::tambah($totalRefundHitungRp, $nilaiRefundItemRp);

                $itemReturSiapSimpan[] = [
                    'item_jual' => $itemJual,
                    'qty' => $qtyRetur,
                    'nilai_refund_rp' => $nilaiRefundItemRp,
                    'layak_jual' => $layakJual,
                    'keterangan_kondisi' => $keteranganKondisi,
                ];

                $qtyDasarRetur = Qty::kali($qtyRetur, $itemJual->satuanProduk->faktor_konversi ?? '1');

                if ($layakJual) {
                    // STOK LAYAK JUAL: Kembalikan ke saldo stok rak toko & buat lot stok baru
                    $saldo = SaldoStok::firstOrCreate(
                        ['produk_id' => $itemJual->produk_id, 'lokasi_stok_id' => $lokasiToko->id],
                        ['qty_dasar' => '0']
                    );
                    $saldo->qty_dasar = Qty::tambah($saldo->qty_dasar, $qtyDasarRetur);
                    $saldo->save();

                    // Buat lot stok masuk retur
                    $lotRetur = LotStok::create([
                        'produk_id' => $itemJual->produk_id,
                        'lokasi_stok_id' => $lokasiToko->id,
                        'item_terima_id' => null,
                        'kode_lot' => 'LOT-RT-' . strtoupper(uniqid()),
                        'qty_awal' => $qtyDasarRetur,
                        'qty_sisa' => $qtyDasarRetur,
                        'hpp_dasar' => $itemJual->hpp_rp ? (string) round((float) $itemJual->hpp_rp / max(1, (float) $itemJual->qty), 6) : '0',
                        'kedaluwarsa_pada' => null,
                    ]);

                    MutasiStok::create([
                        'dokumen_stok_id' => $dokumenStok->id,
                        'produk_id' => $itemJual->produk_id,
                        'lokasi_stok_id' => $lokasiToko->id,
                        'lot_stok_id' => $lotRetur->id,
                        'qty_delta' => '+' . $qtyDasarRetur,
                        'nilai_hpp_rp' => $itemJual->hpp_rp,
                        'keterangan' => "Pengembalian stok layak jual nota retur {$nomorRetur}",
                    ]);
                } else {
                    // STOK RUSAK / TIDAK LAYAK JUAL: Jangan tambah saldo stok toko, langsung alokasikan ke audit susut
                    if (! $dokumenSusut) {
                        $dokumenSusut = SusutStok::create([
                            'cabang_id' => $cabangId,
                            'nomor' => 'SST-RT-' . $nomorRetur,
                            'alasan' => 'rusak_retur',
                            'total_biaya_rp' => '0',
                            'status' => 'disetujui',
                            'catatan' => "Barang retur tidak layak jual nota {$nomorRetur}: {$keteranganKondisi}",
                        ]);
                    }

                    ItemSusut::create([
                        'susut_stok_id' => $dokumenSusut->id,
                        'produk_id' => $itemJual->produk_id,
                        'satuan_produk_id' => $itemJual->satuan_produk_id,
                        'qty' => $qtyRetur,
                        'biaya_satuan_rp' => $itemJual->hpp_rp,
                        'total_biaya_rp' => $nilaiRefundItemRp,
                        'catatan' => "Barang rusak retur: {$keteranganKondisi}",
                    ]);
                }
            }

            // Simpan Dokumen Retur Jual
            $returJual = ReturJual::create([
                'cabang_id' => $cabangId,
                'penjualan_id' => $penjualan->id,
                'shift_kasir_id' => $shiftKasir?->id,
                'pengguna_id' => $penggunaId,
                'nomor' => $nomorRetur,
                'waktu_retur' => now(),
                'status' => 'selesai',
                'total_refund_rp' => $totalRefundHitungRp,
                'alasan' => $data['alasan'] ?? 'Retur pelanggan',
            ]);

            // Simpan Item Retur
            foreach ($itemReturSiapSimpan as $row) {
                ItemRetur::create([
                    'retur_jual_id' => $returJual->id,
                    'item_jual_id' => $row['item_jual']->id,
                    'qty' => $row['qty'],
                    'nilai_refund_rp' => $row['nilai_refund_rp'],
                    'layak_jual' => $row['layak_jual'],
                    'keterangan_kondisi' => $row['keterangan_kondisi'],
                ]);
            }

            // Simpan Pengembalian Dana (Refund)
            $totalDanaRefundRp = '0';
            foreach ($refundsInput as $ref) {
                $metodeBayar = MetodeBayar::findOrFail($ref['metode_bayar_id']);
                $nilaiRefundRp = Uang::bersihkan($ref['nilai_rp']);
                $totalDanaRefundRp = Uang::tambah($totalDanaRefundRp, $nilaiRefundRp);

                RefundBayar::create([
                    'retur_jual_id' => $returJual->id,
                    'metode_bayar_id' => $metodeBayar->id,
                    'nilai_rp' => $nilaiRefundRp,
                    'status' => 'sukses',
                    'ref_eksternal' => $ref['ref_eksternal'] ?? null,
                ]);

                // Jika refund secara tunai, potong kas laci shift kasir
                if ($metodeBayar->jenis === 'tunai') {
                    if (! $shiftKasir) {
                        throw ValidationException::withMessages([
                            'refunds' => ['Pengembalian dana tunai membutuhkan shift kasir yang sedang aktif terbuka.'],
                        ]);
                    }

                    MutasiKas::create([
                        'shift_kasir_id' => $shiftKasir->id,
                        'jenis' => 'refund_tunai',
                        'masuk_rp' => '0',
                        'keluar_rp' => $nilaiRefundRp,
                        'nomor_ref' => $returJual->nomor,
                        'keterangan' => "Pengembalian dana retur nota {$returJual->nomor}",
                    ]);

                    $shiftKasir->saldo_sistem_rp = Uang::kurang($shiftKasir->saldo_sistem_rp, $nilaiRefundRp);
                    $shiftKasir->save();
                }
            }

            // Update status Penjualan (retur_penuh atau retur_sebagian)
            $totalQtyAwal = $penjualan->items->sum('qty');
            $totalQtyDireturSemua = ItemRetur::whereIn('item_jual_id', $penjualan->items->pluck('id'))->sum('qty');

            if (Qty::bandingkan((string) $totalQtyDireturSemua, (string) $totalQtyAwal) >= 0) {
                $penjualan->status = 'retur_penuh';
            } else {
                $penjualan->status = 'retur_sebagian';
            }
            $penjualan->save();

            return $returJual->fresh(['items.itemJual', 'refunds.metodeBayar', 'penjualan']);
        });
    }

    /**
     * Riwayat retur penjualan di cabang.
     */
    public function daftarRetur(string $cabangId, array $filter = []): LengthAwarePaginator
    {
        $query = ReturJual::with(['penjualan', 'pengguna', 'items.itemJual', 'refunds.metodeBayar'])
            ->where('cabang_id', $cabangId);

        if (! empty($filter['cari'])) {
            $cari = $filter['cari'];
            $query->where(function ($q) use ($cari) {
                $q->where('nomor', 'ilike', "%{$cari}%")
                    ->orWhere('alasan', 'ilike', "%{$cari}%")
                    ->orWhereHas('penjualan', function ($qp) use ($cari) {
                        $qp->where('nomor', 'ilike', "%{$cari}%");
                    });
            });
        }

        return $query->orderBy('waktu_retur', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($filter['per_page'] ?? 15);
    }
}

