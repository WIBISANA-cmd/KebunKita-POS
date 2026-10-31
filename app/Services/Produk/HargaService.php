<?php

namespace App\Services\Produk;

use App\Models\HargaProduk;
use App\Models\SatuanProduk;
use App\Services\Pengguna\AuditService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HargaService
{
    /**
     * Dapatkan harga aktif untuk satuan produk tertentu pada cabang spesifik.
     */
    public function ambilHargaAktif(string $satuanProdukId, ?string $cabangId = null, ?Carbon $waktu = null): ?HargaProduk
    {
        $waktuCek = $waktu ?: now();

        $query = HargaProduk::where('satuan_produk_id', $satuanProdukId)
            ->where('mulai_pada', '<=', $waktuCek)
            ->where(function ($q) use ($waktuCek) {
                $q->whereNull('akhir_pada')->orWhere('akhir_pada', '>=', $waktuCek);
            })
            ->orderBy('cabang_id', 'desc') // Utamakan harga cabang spesifik dibanding null (default)
            ->orderBy('mulai_pada', 'desc');

        if ($cabangId) {
            $query->where(function ($q) use ($cabangId) {
                $q->where('cabang_id', $cabangId)->orWhereNull('cabang_id');
            });
        }

        return $query->first();
    }

    /**
     * Tetapkan harga baru untuk satuan produk dengan pencegahan overlap rentang tanggal.
     */
    public function tetapkanHarga(array $data): HargaProduk
    {
        $satuanProdukId = $data['satuan_produk_id'];
        $cabangId = $data['cabang_id'] ?? null;
        $jenisHarga = $data['jenis_harga'] ?? 'reguler';
        $hargaRp = (string) (int) $data['harga_rp'];
        $mulaiPada = Carbon::parse($data['mulai_pada']);
        $akhirPada = ! empty($data['akhir_pada']) ? Carbon::parse($data['akhir_pada']) : null;

        if ($akhirPada && $akhirPada->lte($mulaiPada)) {
            throw ValidationException::withMessages([
                'akhir_pada' => ['Waktu berakhir harus lebih besar dari waktu mulai harga.'],
            ]);
        }

        return DB::transaction(function () use ($satuanProdukId, $cabangId, $jenisHarga, $hargaRp, $mulaiPada, $akhirPada) {
            // Tutup harga aktif sebelumnya jika tidak memiliki akhir_pada dan cabang sama
            $hargaLama = HargaProduk::where('satuan_produk_id', $satuanProdukId)
                ->where('cabang_id', $cabangId)
                ->where('jenis_harga', $jenisHarga)
                ->whereNull('akhir_pada')
                ->where('mulai_pada', '<', $mulaiPada)
                ->first();

            if ($hargaLama) {
                $hargaLama->update(['akhir_pada' => $mulaiPada->copy()->subSecond()]);
            }

            $hargaBaru = HargaProduk::create([
                'satuan_produk_id' => $satuanProdukId,
                'cabang_id' => $cabangId,
                'jenis_harga' => $jenisHarga,
                'harga_rp' => $hargaRp,
                'mulai_pada' => $mulaiPada,
                'akhir_pada' => $akhirPada,
            ]);

            AuditService::catat('HARGA_BARU', 'harga_produk', $hargaBaru->id, null, [
                'satuan_produk_id' => $satuanProdukId,
                'harga_rp' => $hargaRp,
                'cabang_id' => $cabangId,
            ], $cabangId);

            return $hargaBaru;
        });
    }

    /**
     * Ambil seluruh riwayat perubahan harga untuk suatu satuan produk.
     */
    public function riwayat(string $satuanProdukId): Collection
    {
        return HargaProduk::with('cabang')
            ->where('satuan_produk_id', $satuanProdukId)
            ->orderBy('mulai_pada', 'desc')
            ->get();
    }
}

