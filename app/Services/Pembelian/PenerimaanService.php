<?php

namespace App\Services\Pembelian;

use App\Models\DokumenStok;
use App\Models\ItemBeli;
use App\Models\PesananBeli;
use App\Models\TerimaBeli;
use App\Services\Pengguna\AuditService;
use App\Services\Persediaan\StokService;
use App\Support\NomorDokumen;
use App\Support\Qty;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PenerimaanService
{
    public function __construct(
        protected StokService $stokService
    ) {}

    /**
     * Terima barang dari PO secara parsial atau penuh, posting stok dan lot secara atomik.
     */
    public function prosesPenerimaan(PesananBeli $po, array $data, string $penerimaId): TerimaBeli
    {
        if (! in_array($po->status, ['disetujui', 'diterima_sebagian'])) {
            throw ValidationException::withMessages([
                'po' => ['Penerimaan hanya dapat dilakukan pada PO yang telah disetujui atau berstatus diterima sebagian.'],
            ]);
        }

        $lokasiStokId = $data['lokasi_stok_id'];

        return DB::transaction(function () use ($po, $lokasiStokId, $data, $penerimaId) {
            $nomorTerima = NomorDokumen::buat('RCV');

            $terimaBeli = TerimaBeli::create([
                'pesanan_beli_id' => $po->id,
                'lokasi_stok_id' => $lokasiStokId,
                'nomor' => $nomorTerima,
                'waktu_terima' => now(),
                'penerima_id' => $penerimaId,
            ]);

            // Dokumen stok untuk mutasi ledger
            $dokumenStok = DokumenStok::create([
                'cabang_id' => $po->cabang_id,
                'jenis' => 'penerimaan_beli',
                'nomor' => $nomorTerima,
                'referensi_id' => $po->nomor,
                'waktu_posting' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $itemBeli = ItemBeli::with('satuanProduk.satuan')->where('pesanan_beli_id', $po->id)->findOrFail($item['item_beli_id']);
                $qtyDiterima = (string) $item['qty_diterima'];

                if (! Qty::lebihDariNol($qtyDiterima)) {
                    continue;
                }

                // Cek agar penerimaan tidak melebihi sisa PO secara tidak wajar
                $sisaBolehDiterima = Qty::kurang($itemBeli->qty, $itemBeli->qty_diterima);
                if (Qty::bandingkan($qtyDiterima, $sisaBolehDiterima) > 0) {
                    throw ValidationException::withMessages([
                        'qty' => ["Jumlah diterima ({$qtyDiterima}) melebihi sisa pesanan ({$sisaBolehDiterima}) untuk item terkait."],
                    ]);
                }

                // Konversi kuantitas diterima ke satuan dasar produk
                $faktorKeDasar = $itemBeli->satuanProduk->faktor_ke_dasar;
                $qtyDiterimaDasar = Qty::keSatuanDasar($qtyDiterima, $faktorKeDasar);

                // Hitung biaya perolehan / HPP per satuan dasar
                $biayaSatuanRp = bcdiv((string) $itemBeli->harga_rp, $faktorKeDasar, 6);

                $itemTerima = $terimaBeli->items()->create([
                    'item_beli_id' => $itemBeli->id,
                    'qty_diterima' => $qtyDiterima,
                    'biaya_satuan_rp' => $biayaSatuanRp,
                    'kedaluwarsa_pada' => $item['kedaluwarsa_pada'] ?? null,
                ]);

                // Buat batch lot baru dan catat ledger mutasi (+)
                $kodeLot = 'LOT-' . now()->format('Ymd') . '-' . substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 4);

                $this->stokService->tambahStokLot(
                    $itemBeli->produk_id,
                    $lokasiStokId,
                    $qtyDiterimaDasar,
                    $biayaSatuanRp,
                    $dokumenStok,
                    $kodeLot,
                    $item['kedaluwarsa_pada'] ?? null,
                    $itemTerima->id,
                    "Penerimaan PO: {$po->nomor}"
                );

                // Update qty_diterima pada baris PO
                $itemBeli->qty_diterima = Qty::tambah($itemBeli->qty_diterima, $qtyDiterima);
                $itemBeli->save();
            }

            // Periksa apakah semua item PO sudah lunas diterima
            $po->load('items');
            $selesaiPenuh = true;
            foreach ($po->items as $ib) {
                if (Qty::bandingkan($ib->qty_diterima, $ib->qty) < 0) {
                    $selesaiPenuh = false;
                    break;
                }
            }

            $po->status = $selesaiPenuh ? 'diterima_penuh' : 'diterima_sebagian';
            $po->save();

            AuditService::catat('TERIMA_BARANG', 'terima_beli', $terimaBeli->id, null, [
                'nomor' => $nomorTerima,
                'po_nomor' => $po->nomor,
                'status_po' => $po->status,
            ], $po->cabang_id);

            return $terimaBeli->load(['items.itemBeli.produk', 'lokasi']);
        });
    }
}

