<?php

namespace App\Services\Persediaan;

use App\Models\DokumenStok;
use App\Models\MutasiStok;
use App\Models\OpnameStok;
use App\Models\SaldoStok;
use App\Services\Pengguna\AuditService;
use App\Support\NomorDokumen;
use App\Support\Qty;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OpnameService
{
    public function postingOpname(array $data, string $cabangId, string $petugasId): OpnameStok
    {
        $lokasiStokId = $data['lokasi_stok_id'];

        return DB::transaction(function () use ($data, $cabangId, $petugasId, $lokasiStokId) {
            $nomor = NomorDokumen::buat('OPN');

            $opname = OpnameStok::create([
                'cabang_id' => $cabangId,
                'lokasi_stok_id' => $lokasiStokId,
                'nomor' => $nomor,
                'status' => 'diposting',
                'waktu_hitung' => now(),
                'disetujui_oleh' => $petugasId,
            ]);

            $dokumenStok = DokumenStok::create([
                'cabang_id' => $cabangId,
                'jenis' => 'opname',
                'nomor' => $nomor,
                'referensi_id' => $nomor,
                'waktu_posting' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $produkId = $item['produk_id'];
                $qtyFisik = (string) $item['qty_fisik'];

                // Lock saldo saat ini
                $saldo = SaldoStok::where('produk_id', $produkId)
                    ->where('lokasi_stok_id', $lokasiStokId)
                    ->lockForUpdate()
                    ->first();

                $qtySistem = $saldo ? $saldo->qty_dasar : '0.000';
                $selisih = Qty::kurang($qtyFisik, $qtySistem);

                $opname->items()->create([
                    'produk_id' => $produkId,
                    'qty_sistem' => $qtySistem,
                    'qty_fisik' => $qtyFisik,
                    'selisih' => $selisih,
                ]);

                // Jika ada selisih, posting penyesuaian ke mutasi ledger
                if (Qty::bandingkan($selisih, '0') !== 0) {
                    MutasiStok::create([
                        'dokumen_stok_id' => $dokumenStok->id,
                        'produk_id' => $produkId,
                        'lokasi_stok_id' => $lokasiStokId,
                        'qty_delta' => $selisih,
                        'nilai_hpp_rp' => '0',
                        'keterangan' => "Penyesuaian Opname Stok: {$nomor}",
                    ]);

                    if (! $saldo) {
                        $saldo = SaldoStok::create([
                            'produk_id' => $produkId,
                            'lokasi_stok_id' => $lokasiStokId,
                            'qty_dasar' => '0.000',
                        ]);
                    }

                    $saldo->qty_dasar = $qtyFisik;
                    $saldo->save();
                }
            }

            AuditService::catat('OPNAME_POSTING', 'opname_stok', $opname->id, null, [
                'nomor' => $nomor,
                'total_item' => count($data['items']),
            ], $cabangId);

            return $opname->load(['items.produk', 'lokasi']);
        });
    }
}

