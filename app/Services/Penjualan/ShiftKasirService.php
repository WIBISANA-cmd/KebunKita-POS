<?php

namespace App\Services\Penjualan;

use App\Models\MutasiKas;
use App\Models\ShiftKasir;
use App\Support\Uang;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShiftKasirService
{
    /**
     * Ambil shift kasir yang sedang aktif (buka) untuk pengguna di cabang tertentu.
     */
    public function ambilShiftAktif(string $cabangId, string $penggunaId): ?ShiftKasir
    {
        return ShiftKasir::with(['cabang', 'pengguna', 'mutasiKas'])
            ->where('cabang_id', $cabangId)
            ->where('pengguna_id', $penggunaId)
            ->where('status', 'buka')
            ->first();
    }

    /**
     * Buka shift baru kasir dengan modal awal.
     */
    public function bukaShift(string $cabangId, string $penggunaId, string $modalAwalRp): ShiftKasir
    {
        $shiftAktif = $this->ambilShiftAktif($cabangId, $penggunaId);
        if ($shiftAktif) {
            throw ValidationException::withMessages([
                'shift' => ['Pengguna masih memiliki shift kasir yang aktif (terbuka). Tutup shift sebelumnya terlebih dahulu.'],
            ]);
        }

        $modalAwalRp = Uang::bersihkan($modalAwalRp);

        return DB::transaction(function () use ($cabangId, $penggunaId, $modalAwalRp) {
            $shift = ShiftKasir::create([
                'cabang_id' => $cabangId,
                'pengguna_id' => $penggunaId,
                'waktu_buka' => now(),
                'modal_awal_rp' => $modalAwalRp,
                'saldo_sistem_rp' => $modalAwalRp,
                'status' => 'buka',
            ]);

            MutasiKas::create([
                'shift_kasir_id' => $shift->id,
                'jenis' => 'modal_awal',
                'masuk_rp' => $modalAwalRp,
                'keluar_rp' => '0',
                'nomor_ref' => 'MODAL-' . $shift->id,
                'keterangan' => 'Modal awal kas laci',
            ]);

            return $shift->fresh(['cabang', 'pengguna', 'mutasiKas']);
        });
    }

    /**
     * Tutup shift kasir dan rekonsiliasi kas fisik.
     */
    public function tutupShift(string $shiftId, string $saldoFisikRp, ?string $catatan = null): ShiftKasir
    {
        $shift = ShiftKasir::with('mutasiKas')->findOrFail($shiftId);

        if ($shift->status !== 'buka') {
            throw ValidationException::withMessages([
                'shift' => ['Shift kasir ini sudah ditutup sebelumnya.'],
            ]);
        }

        $saldoFisikRp = Uang::bersihkan($saldoFisikRp);

        return DB::transaction(function () use ($shift, $saldoFisikRp, $catatan) {
            // Hitung total kas sistem berdasarkan mutasi fisik di shift ini
            $totalMasuk = '0';
            $totalKeluar = '0';

            foreach ($shift->mutasiKas as $mutasi) {
                $totalMasuk = Uang::tambah($totalMasuk, $mutasi->masuk_rp);
                $totalKeluar = Uang::tambah($totalKeluar, $mutasi->keluar_rp);
            }

            $saldoSistemRp = Uang::kurang($totalMasuk, $totalKeluar);
            $selisihRp = Uang::kurang($saldoFisikRp, $saldoSistemRp);

            $shift->update([
                'waktu_tutup' => now(),
                'saldo_sistem_rp' => $saldoSistemRp,
                'saldo_fisik_rp' => $saldoFisikRp,
                'selisih_rp' => $selisihRp,
                'catatan_selisih' => $catatan,
                'status' => 'tutup',
            ]);

            return $shift->fresh(['cabang', 'pengguna', 'mutasiKas']);
        });
    }

    /**
     * Catat penambahan atau pengeluaran kas laci operasional manual (kas masuk/kas keluar).
     */
    public function catatMutasiManual(
        string $shiftId,
        string $jenis,
        string $jumlahRp,
        string $keterangan
    ): MutasiKas {
        $shift = ShiftKasir::findOrFail($shiftId);

        if ($shift->status !== 'buka') {
            throw ValidationException::withMessages([
                'shift' => ['Tidak dapat menambah mutasi kas pada shift yang sudah ditutup.'],
            ]);
        }

        $jumlahRp = Uang::bersihkan($jumlahRp);

        return DB::transaction(function () use ($shift, $jenis, $jumlahRp, $keterangan) {
            $masuk = $jenis === 'kas_masuk_manual' ? $jumlahRp : '0';
            $keluar = $jenis === 'kas_keluar_manual' ? $jumlahRp : '0';

            $mutasi = MutasiKas::create([
                'shift_kasir_id' => $shift->id,
                'jenis' => $jenis,
                'masuk_rp' => $masuk,
                'keluar_rp' => $keluar,
                'nomor_ref' => 'MUTASI-' . strtoupper(uniqid()),
                'keterangan' => $keterangan,
            ]);

            // Update running balance saldo sistem di shift
            $shift->saldo_sistem_rp = Uang::kurang(
                Uang::tambah($shift->saldo_sistem_rp, $masuk),
                $keluar
            );
            $shift->save();

            return $mutasi;
        });
    }

    /**
     * Riwayat shift kasir di cabang.
     */
    public function riwayatShift(string $cabangId): Collection
    {
        return ShiftKasir::with(['pengguna'])
            ->where('cabang_id', $cabangId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
    }
}

