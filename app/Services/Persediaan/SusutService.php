<?php

namespace App\Services\Persediaan;

use App\Models\DokumenStok;
use App\Models\LotStok;
use App\Models\MutasiStok;
use App\Models\SaldoStok;
use App\Models\SusutStok;
use App\Services\Pengguna\AuditService;
use App\Support\NomorDokumen;
use App\Support\Qty;
use App\Support\Uang;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SusutService
{
    /**
     * Catat susut sayur rusak/busuk langsung dari lot tertentu secara atomik.
     */
    public function catatSusut(array $data, string $cabangId, string $petugasId): SusutStok
    {
        $lokasiStokId = $data['lokasi_stok_id'];
        $alasan = $data['alasan'] ?? 'Sayur busuk/rusak';

        return DB::transaction(function () use ($data, $cabangId, $petugasId, $lokasiStokId, $alasan) {
            $nomor = NomorDokumen::buat('SST');

            $susut = SusutStok::create([
                'cabang_id' => $cabangId,
                'lokasi_stok_id' => $lokasiStokId,
                'nomor' => $nomor,
                'status' => 'diposting',
                'alasan' => $alasan,
                'disetujui_oleh' => $petugasId,
            ]);

            $dokumenStok = DokumenStok::create([
                'cabang_id' => $cabangId,
                'jenis' => 'susut',
                'nomor' => $nomor,
                'referensi_id' => $nomor,
                'waktu_posting' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $lotStok = LotStok::lockForUpdate()->findOrFail($item['lot_stok_id']);
                $qtySusut = (string) $item['qty'];

                if (Qty::bandingkan($qtySusut, $lotStok->qty_sisa) > 0) {
                    throw ValidationException::withMessages([
                        'qty' => ["Jumlah susut ({$qtySusut}) melebihi sisa lot ({$lotStok->qty_sisa}) untuk lot {$lotStok->kode_lot}."],
                    ]);
                }

                $nilaiHppRp = Uang::kali($qtySusut, (int) round((float) $lotStok->hpp_dasar));

                $susut->items()->create([
                    'lot_stok_id' => $lotStok->id,
                    'qty' => $qtySusut,
                    'nilai_hpp_rp' => $nilaiHppRp,
                ]);

                // Kurangi lot sisa
                $lotStok->qty_sisa = Qty::kurang($lotStok->qty_sisa, $qtySusut);
                $lotStok->save();

                // Kurangi saldo terpelihara
                $saldo = SaldoStok::where('produk_id', $lotStok->produk_id)
                    ->where('lokasi_stok_id', $lokasiStokId)
                    ->lockForUpdate()
                    ->first();

                if ($saldo) {
                    $saldo->qty_dasar = Qty::kurang($saldo->qty_dasar, $qtySusut);
                    $saldo->save();
                }

                // Catat mutasi ledger (-)
                MutasiStok::create([
                    'dokumen_stok_id' => $dokumenStok->id,
                    'produk_id' => $lotStok->produk_id,
                    'lokasi_stok_id' => $lokasiStokId,
                    'lot_stok_id' => $lotStok->id,
                    'qty_delta' => '-' . $qtySusut,
                    'nilai_hpp_rp' => $nilaiHppRp,
                    'keterangan' => "Susut: {$alasan} ({$nomor})",
                ]);
            }

            AuditService::catat('SUSUT_POSTING', 'susut_stok', $susut->id, null, [
                'nomor' => $nomor,
                'alasan' => $alasan,
            ], $cabangId);

            return $susut->load(['items.lot.produk', 'lokasi']);
        });
    }
}

