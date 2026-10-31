<?php

namespace App\Services\Laporan;

use App\Models\Penjualan;
use App\Models\ReturJual;
use App\Models\ItemSusut;
use App\Models\ShiftKasir;
use App\Models\Produk;
use App\Models\ItemJual;
use App\Support\Uang;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardService
{
    /** Status penjualan yang dihitung sebagai omzet. */
    private const STATUS_TERHITUNG = ['selesai', 'retur_sebagian'];

    /** Jumlah irisan kategori sebelum sisanya dilipat menjadi "Lainnya". */
    private const MAKS_IRISAN_KATEGORI = 4;

    private const ZONA_WAKTU = 'Asia/Jakarta';

    /**
     * Ambil ringkasan KPI bisnis cabang hari ini beserta perubahannya dibanding kemarin.
     */
    public function ambilRingkasan(string $cabangId): array
    {
        $hariIni = Carbon::today(self::ZONA_WAKTU);
        $besok = $hariIni->copy()->addDay();
        $kemarin = $hariIni->copy()->subDay();

        $agregatHariIni = $this->agregatPenjualan($cabangId, $hariIni, $besok);
        $agregatKemarin = $this->agregatPenjualan($cabangId, $kemarin, $hariIni);

        $omzetBersihRp = $agregatHariIni['omzet_bersih_rp'];
        $labaKotorRp = $agregatHariIni['laba_kotor_rp'];
        $marginKotorPersen = (float) $omzetBersihRp > 0
            ? round(((float) $labaKotorRp / (float) $omzetBersihRp) * 100, 1)
            : 0;

        $produkTerjual = $this->hitungProdukTerjual($cabangId, $hariIni, $besok);
        $produkTerjualKemarin = $this->hitungProdukTerjual($cabangId, $kemarin, $hariIni);

        // Total Biaya Susut Hari Ini
        $totalSusutHariIniRp = ItemSusut::whereHas('susut', fn ($q) => $q
                ->where('cabang_id', $cabangId)
                ->whereDate('created_at', $hariIni)
                ->where('status', 'diposting'))
            ->sum('nilai_hpp_rp');

        // Kas Fisik Aktif di Laci Shift Kasir
        $shiftAktif = ShiftKasir::where('cabang_id', $cabangId)
            ->where('status', 'buka')
            ->first();

        $kasAktifRp = $shiftAktif ? $shiftAktif->saldo_sistem_rp : '0';

        // Jumlah Produk dengan Stok Menipis
        $stokMenipisCount = Produk::where('aktif', true)
            ->where('stok_minimum', '>', 0)
            ->whereRaw(
                '(select coalesce(sum(s.qty_dasar), 0) from saldo_stok s
                    join lokasi_stok l on l.id = s.lokasi_stok_id
                    where s.produk_id = produk.id and l.cabang_id = ?) <= produk.stok_minimum',
                [$cabangId]
            )
            ->count();

        return [
            'omzet_bersih_rp' => $omzetBersihRp,
            'total_transaksi' => $agregatHariIni['total_transaksi'],
            'laba_kotor_rp' => $labaKotorRp,
            'margin_kotor_persen' => $marginKotorPersen,
            'produk_terjual' => $produkTerjual,
            'perubahan_persen' => [
                'omzet' => $this->persenPerubahan((float) $omzetBersihRp, (float) $agregatKemarin['omzet_bersih_rp']),
                'transaksi' => $this->persenPerubahan((float) $agregatHariIni['total_transaksi'], (float) $agregatKemarin['total_transaksi']),
                'laba' => $this->persenPerubahan((float) $labaKotorRp, (float) $agregatKemarin['laba_kotor_rp']),
                'produk' => $this->persenPerubahan((float) $produkTerjual, (float) $produkTerjualKemarin),
            ],
            'susut_rp' => (string) $totalSusutHariIniRp,
            'kas_aktif_rp' => $kasAktifRp,
            'stok_menipis_count' => $stokMenipisCount,
            'shift_terbuka' => $shiftAktif !== null,
        ];
    }

    /**
     * Tren omzet bersih & laba kotor. Tiap periode dipecah menjadi maksimal 7 kelompok.
     *
     * @param  string  $periode  7hari | 4minggu | 6bulan
     */
    public function ambilTrenPenjualan(string $cabangId, string $periode = '7hari'): array
    {
        $hariIni = Carbon::today(self::ZONA_WAKTU)->locale('id');
        $kelompok = [];

        if ($periode === '6bulan') {
            $awalBulan = $hariIni->copy()->startOfMonth();
            for ($i = 5; $i >= 0; $i--) {
                $mulai = $awalBulan->copy()->subMonthsNoOverflow($i);
                $kelompok[] = [$mulai, $mulai->copy()->addMonthNoOverflow(), $mulai->isoFormat('MMM')];
            }
        } elseif ($periode === '4minggu') {
            for ($i = 3; $i >= 0; $i--) {
                $mulai = $hariIni->copy()->subDays(($i * 7) + 6);
                $kelompok[] = [$mulai, $mulai->copy()->addDays(7), $mulai->isoFormat('D MMM')];
            }
        } else {
            for ($i = 6; $i >= 0; $i--) {
                $mulai = $hariIni->copy()->subDays($i);
                $kelompok[] = [$mulai, $mulai->copy()->addDay(), $mulai->isoFormat('ddd')];
            }
        }

        return array_map(function (array $item) use ($cabangId) {
            [$mulai, $akhir, $label] = $item;
            $agregat = $this->agregatPenjualan($cabangId, $mulai, $akhir);

            return [
                'label' => $label,
                'tanggal' => $mulai->toDateString(),
                'omzet_rp' => $agregat['omzet_bersih_rp'],
                'laba_kotor_rp' => $agregat['laba_kotor_rp'],
                'total_transaksi' => $agregat['total_transaksi'],
            ];
        }, $kelompok);
    }

    /**
     * Pangsa penjualan per kategori produk, dibanding periode sebelumnya yang sama panjang.
     *
     * @param  string  $periode  hari_ini | 7hari | 30hari
     */
    public function ambilPenjualanKategori(string $cabangId, string $periode = '7hari'): array
    {
        [$mulai, $akhir, $mulaiLalu] = $this->rentangPeriode($periode);

        $kini = $this->omzetPerKategori($cabangId, $mulai, $akhir);
        $lalu = $this->omzetPerKategori($cabangId, $mulaiLalu, $mulai)->keyBy('kategori_id');
        $totalRp = (float) $kini->sum('omzet_rp');

        $utama = $kini->take(self::MAKS_IRISAN_KATEGORI);
        $sisa = $kini->slice(self::MAKS_IRISAN_KATEGORI);

        $hasil = $utama->map(fn ($baris) => [
            'nama' => $baris->nama,
            'omzet_rp' => (string) $baris->omzet_rp,
            'persen' => $totalRp > 0 ? round(((float) $baris->omzet_rp / $totalRp) * 100, 1) : 0,
            'perubahan_persen' => $this->persenPerubahan(
                (float) $baris->omzet_rp,
                (float) ($lalu->get($baris->kategori_id)->omzet_rp ?? 0)
            ),
        ])->values()->all();

        if ($sisa->isNotEmpty()) {
            $omzetSisa = (float) $sisa->sum('omzet_rp');
            $omzetSisaLalu = (float) $lalu->except($utama->pluck('kategori_id')->all())->sum('omzet_rp');

            $hasil[] = [
                'nama' => 'Lainnya',
                'omzet_rp' => (string) $omzetSisa,
                'persen' => $totalRp > 0 ? round(($omzetSisa / $totalRp) * 100, 1) : 0,
                'perubahan_persen' => $this->persenPerubahan($omzetSisa, $omzetSisaLalu),
            ];
        }

        return ['total_rp' => (string) $totalRp, 'kategori' => $hasil];
    }

    /**
     * Pangsa nilai pembayaran sukses per jenis metode bayar.
     *
     * @param  string  $periode  hari_ini | 7hari | 30hari
     */
    public function ambilPangsaMetodeBayar(string $cabangId, string $periode = '7hari'): array
    {
        [$mulai, $akhir] = $this->rentangPeriode($periode);

        $baris = DB::table('bayar_jual')
            ->join('penjualan', 'penjualan.id', '=', 'bayar_jual.penjualan_id')
            ->join('metode_bayar', 'metode_bayar.id', '=', 'bayar_jual.metode_bayar_id')
            ->where('penjualan.cabang_id', $cabangId)
            ->where('penjualan.waktu_penjualan', '>=', $mulai->toIso8601String())
            ->where('penjualan.waktu_penjualan', '<', $akhir->toIso8601String())
            ->whereIn('penjualan.status', self::STATUS_TERHITUNG)
            ->where('bayar_jual.status', 'sukses')
            ->groupBy('metode_bayar.jenis')
            ->select('metode_bayar.jenis', DB::raw('SUM(bayar_jual.nilai_rp) as nilai_rp'))
            ->orderByDesc('nilai_rp')
            ->get();

        $totalRp = (float) $baris->sum('nilai_rp');

        return [
            'total_rp' => (string) $totalRp,
            'metode' => $baris->map(fn ($item) => [
                'jenis' => $item->jenis,
                'nilai_rp' => (string) $item->nilai_rp,
                'persen' => $totalRp > 0 ? round(((float) $item->nilai_rp / $totalRp) * 100, 1) : 0,
            ])->all(),
        ];
    }

    /**
     * Omzet bersih, laba kotor, dan jumlah transaksi pada rentang [mulai, akhir).
     */
    private function agregatPenjualan(string $cabangId, Carbon $mulai, Carbon $akhir): array
    {
        $penjualan = Penjualan::where('cabang_id', $cabangId)
            ->where('waktu_penjualan', '>=', $mulai->toIso8601String())
            ->where('waktu_penjualan', '<', $akhir->toIso8601String())
            ->whereIn('status', self::STATUS_TERHITUNG)
            ->selectRaw('COALESCE(SUM(total_rp), 0) as total_rp, COALESCE(SUM(hpp_total_rp), 0) as hpp_rp, COUNT(*) as transaksi')
            ->toBase()
            ->first();

        $returRp = ReturJual::where('cabang_id', $cabangId)
            ->where('waktu_retur', '>=', $mulai->toIso8601String())
            ->where('waktu_retur', '<', $akhir->toIso8601String())
            ->where('status', 'selesai')
            ->sum('total_refund_rp');

        $omzetBersihRp = Uang::kurang((string) $penjualan->total_rp, (string) $returRp);

        return [
            'omzet_bersih_rp' => $omzetBersihRp,
            'laba_kotor_rp' => Uang::kurang($omzetBersihRp, (string) $penjualan->hpp_rp),
            'total_transaksi' => (int) $penjualan->transaksi,
        ];
    }

    private function hitungProdukTerjual(string $cabangId, Carbon $mulai, Carbon $akhir): int
    {
        return (int) ItemJual::join('penjualan', 'penjualan.id', '=', 'item_jual.penjualan_id')
            ->where('penjualan.cabang_id', $cabangId)
            ->where('penjualan.waktu_penjualan', '>=', $mulai->toIso8601String())
            ->where('penjualan.waktu_penjualan', '<', $akhir->toIso8601String())
            ->whereIn('penjualan.status', self::STATUS_TERHITUNG)
            ->distinct()
            ->count('item_jual.produk_id');
    }

    private function omzetPerKategori(string $cabangId, Carbon $mulai, Carbon $akhir): Collection
    {
        return DB::table('item_jual')
            ->join('penjualan', 'penjualan.id', '=', 'item_jual.penjualan_id')
            ->join('produk', 'produk.id', '=', 'item_jual.produk_id')
            ->join('kategori_produk', 'kategori_produk.id', '=', 'produk.kategori_produk_id')
            ->where('penjualan.cabang_id', $cabangId)
            ->where('penjualan.waktu_penjualan', '>=', $mulai->toIso8601String())
            ->where('penjualan.waktu_penjualan', '<', $akhir->toIso8601String())
            ->whereIn('penjualan.status', self::STATUS_TERHITUNG)
            ->groupBy('kategori_produk.id', 'kategori_produk.nama')
            ->select(
                'kategori_produk.id as kategori_id',
                'kategori_produk.nama',
                DB::raw('SUM(item_jual.total_rp) as omzet_rp')
            )
            ->orderByDesc('omzet_rp')
            ->get();
    }

    /**
     * @return array{0: Carbon, 1: Carbon, 2: Carbon} mulai, akhir (eksklusif), mulai periode sebelumnya
     */
    private function rentangPeriode(string $periode): array
    {
        $jumlahHari = ['hari_ini' => 1, '7hari' => 7, '30hari' => 30][$periode] ?? 7;
        $besok = Carbon::today(self::ZONA_WAKTU)->addDay();
        $mulai = $besok->copy()->subDays($jumlahHari);

        return [$mulai, $besok, $mulai->copy()->subDays($jumlahHari)];
    }

    /**
     * Persen perubahan terhadap nilai lalu; null bila tidak ada dasar pembanding.
     */
    private function persenPerubahan(float $kini, float $lalu): ?float
    {
        if ($lalu <= 0) {
            return null;
        }

        return round((($kini - $lalu) / $lalu) * 100, 1);
    }

    /**
     * Top 5 Produk Paling Laris periode 30 hari terakhir.
     */
    public function ambilTopProduk(string $cabangId): array
    {
        $sejak = Carbon::today('Asia/Jakarta')->subDays(30);

        return ItemJual::select(
            'item_jual.produk_id',
            'item_jual.nama_snapshot',
            'item_jual.satuan_snapshot',
            DB::raw('SUM(item_jual.qty) as total_qty'),
            DB::raw('SUM(item_jual.total_rp) as total_omzet_rp')
        )
            ->join('penjualan', 'penjualan.id', '=', 'item_jual.penjualan_id')
            ->where('penjualan.cabang_id', $cabangId)
            ->where('penjualan.waktu_penjualan', '>=', $sejak)
            ->whereIn('penjualan.status', ['selesai', 'retur_sebagian'])
            ->groupBy('item_jual.produk_id', 'item_jual.nama_snapshot', 'item_jual.satuan_snapshot')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->toArray();
    }
}

