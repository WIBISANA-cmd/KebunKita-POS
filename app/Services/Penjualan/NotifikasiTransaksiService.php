<?php

namespace App\Services\Penjualan;

use App\Models\Penjualan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class NotifikasiTransaksiService
{
    private const STATUS_TERHITUNG = ['selesai', 'retur_sebagian'];

    /**
     * Transaksi terakhir cabang untuk panel lonceng, beserta jumlah yang belum dilihat.
     *
     * @return array{transaksi: list<array<string, mixed>>, belum_dilihat: int}
     */
    public function ambil(string $cabangId, int $batas = 8, ?string $sejak = null): array
    {
        $penjualan = $this->queryCabang($cabangId)
            ->with(['pelanggan:id,nama', 'shiftKasir.pengguna:id,nama', 'pembayaran.metodeBayar:id,nama'])
            ->withCount('items')
            ->orderByDesc('waktu_penjualan')
            ->orderByDesc('id')
            ->limit($batas)
            ->get();

        return [
            'transaksi' => $penjualan->map(fn (Penjualan $p) => $this->ringkas($p))->all(),
            'belum_dilihat' => $sejak
                ? $this->queryCabang($cabangId)
                    ->where('waktu_penjualan', '>', Carbon::parse($sejak)->toIso8601String())
                    ->count()
                : 0,
        ];
    }

    /**
     * Bentuk ringkas yang sama dipakai respons API dan siaran WebSocket.
     *
     * @return array<string, mixed>
     */
    public function ringkas(Penjualan $penjualan): array
    {
        $penjualan->loadMissing(['pelanggan:id,nama', 'shiftKasir.pengguna:id,nama', 'pembayaran.metodeBayar:id,nama']);

        if ($penjualan->items_count === null) {
            $penjualan->loadCount('items');
        }

        return [
            'id' => $penjualan->id,
            'nomor' => $penjualan->nomor,
            'total_rp' => (string) $penjualan->total_rp,
            'jumlah_item' => $penjualan->items_count,
            'waktu_penjualan' => $penjualan->waktu_penjualan->toIso8601String(),
            'pelanggan' => $penjualan->pelanggan?->nama,
            'kasir' => $penjualan->shiftKasir?->pengguna?->nama,
            'metode_bayar' => $penjualan->pembayaran->first()?->metodeBayar?->nama,
        ];
    }

    private function queryCabang(string $cabangId): Builder
    {
        return Penjualan::where('cabang_id', $cabangId)
            ->whereIn('status', self::STATUS_TERHITUNG);
    }
}
