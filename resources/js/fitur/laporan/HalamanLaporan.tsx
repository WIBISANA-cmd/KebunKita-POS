import { useState, useEffect } from 'react';
import { 
    Download, 
    Calendar 
} from 'lucide-react';
import { apiClient } from '@/layanan/apiClient';
import { type Penjualan } from '@/tipe';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman } from '@/komponen/ui/Paginasi';
import { PEGAS } from '@/komponen/ui/Animasi';
import { motion } from 'motion/react';
import { Tombol } from '@/komponen/ui/Tombol';
import { Badge } from '@/komponen/ui/Badge';
import { SkeletonTabel } from '@/komponen/ui/SkeletonTabel';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';

interface DataLabaRugi {
    periode: {
        tanggal_awal: string;
        tanggal_akhir: string;
    };
    pendapatan: {
        penjualan_kotor_rp: string;
        diskon_penjualan_rp: string;
        retur_penjualan_rp: string;
        penjualan_bersih_rp: string;
        pajak_dikumpulkan_rp: string;
    };
    harga_pokok_penjualan: {
        hpp_aktual_fefo_rp: string;
    };
    laba_kotor_rp: string;
    beban_operasional: {
        biaya_susut_sayur_rp: string;
    };
    laba_bersih_rp: string;
    margin_bersih_persen: number;
}

const formatTanggalLokal = (tanggal: Date): string =>
    [
        tanggal.getFullYear(),
        String(tanggal.getMonth() + 1).padStart(2, '0'),
        String(tanggal.getDate()).padStart(2, '0'),
    ].join('-');

export function HalamanLaporan({
    tambahToast,
}: {
    tambahToast: (tipe: 'sukses' | 'error' | 'info', pesan: string) => void;
}) {
    const [tabAktif, setTabAktif] = useState<'penjualan' | 'laba_rugi'>('penjualan');
    
    // Filter Tanggal (default 30 hari terakhir)
    const hariIni = formatTanggalLokal(new Date());
    const tigaPuluhHariLalu = formatTanggalLokal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const [tanggalAwal, setTanggalAwal] = useState(tigaPuluhHariLalu);
    const [tanggalAkhir, setTanggalAkhir] = useState(hariIni);

    // Data Penjualan
    const laporanPenjualan = useDaftarBerhalaman<Penjualan>('/laporan/penjualan', {
        filter: { tanggal_awal: tanggalAwal, tanggal_akhir: tanggalAkhir },
        aktif: tabAktif === 'penjualan',
    });
    const daftarPenjualan = laporanPenjualan.data;
    const sedangMemuatPenjualan = laporanPenjualan.memuat && daftarPenjualan.length === 0;
    const pesanErrorPenjualan = laporanPenjualan.galat;

    // Data Laba Rugi
    const [dataLabaRugi, setDataLabaRugi] = useState<DataLabaRugi | null>(null);
    const [sedangMemuatLabaRugi, setSedangMemuatLabaRugi] = useState(false);
    const [pesanErrorLabaRugi, setPesanErrorLabaRugi] = useState<string | null>(null);

    useEffect(() => {
        if (tabAktif === 'laba_rugi') {
            muatLaporanLabaRugi();
        }
    }, [tabAktif, tanggalAwal, tanggalAkhir]);

    const muatLaporanLabaRugi = async () => {
        setSedangMemuatLabaRugi(true);
        setPesanErrorLabaRugi(null);
        try {
            const res = await apiClient.get('/laporan/laba-rugi', {
                params: {
                    tanggal_awal: tanggalAwal,
                    tanggal_akhir: tanggalAkhir,
                },
            });
            setDataLabaRugi(res.data.data);
        } catch (err: any) {
            setPesanErrorLabaRugi(err.response?.data?.pesan || 'Gagal memuat laporan laba rugi.');
        } finally {
            setSedangMemuatLabaRugi(false);
        }
    };

    const handleEksporCsv = () => {
        const url = `/api/v1/laporan/ekspor-penjualan?tanggal_awal=${tanggalAwal}&tanggal_akhir=${tanggalAkhir}`;
        window.open(url, '_blank');
        tambahToast('sukses', 'Pengunduhan berkas laporan CSV dimulai.');
    };

    const formatRp = (angka: number | string) => {
        const val = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    return (
        <div className="space-y-3">
            {/* HEADER */}
            <Kartu className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-[#14221b]">Laporan Keuangan & Analitik</h2>
                    <p className="text-xs text-[#5f756b]">
                        Rekap transaksi penjualan, analisis laba kotor HPP FEFO, dan audit beban susut sayur.
                    </p>
                </div>

                {/* TABS */}
                <div className="flex items-center gap-1.5 p-1 bg-[#f6f9f7] rounded-xl border border-[#e3ece7] text-xs font-semibold">
                    <button
                        onClick={() => setTabAktif('penjualan')}
                        className={`relative isolate px-3 py-1.5 rounded-lg transition-colors ${
                            tabAktif === 'penjualan' ? 'text-[#007b40]' : 'text-[#5f756b] hover:text-[#14221b]'
                        }`}
                    >
                        {tabAktif === 'penjualan' && (
                            <motion.span layoutId="tab-laporan-aktif" transition={PEGAS} className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm" />
                        )}
                        Rekap Penjualan
                    </button>
                    <button
                        onClick={() => setTabAktif('laba_rugi')}
                        className={`relative isolate px-3 py-1.5 rounded-lg transition-colors ${
                            tabAktif === 'laba_rugi' ? 'text-[#007b40]' : 'text-[#5f756b] hover:text-[#14221b]'
                        }`}
                    >
                        {tabAktif === 'laba_rugi' && (
                            <motion.span layoutId="tab-laporan-aktif" transition={PEGAS} className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm" />
                        )}
                        Laba Rugi Operasional
                    </button>
                </div>
            </Kartu>

            {/* FILTER RENTANG TANGGAL & EKSPOR */}
            <Kartu className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-[#5f756b] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Periode:
                    </span>
                    <input
                        type="date"
                        value={tanggalAwal}
                        onChange={(e) => setTanggalAwal(e.target.value)}
                        className="px-2.5 py-1 bg-[#f6f9f7] rounded-lg border border-[#e3ece7] text-xs text-[#14221b]"
                    />
                    <span className="text-[#5f756b]">s/d</span>
                    <input
                        type="date"
                        value={tanggalAkhir}
                        onChange={(e) => setTanggalAkhir(e.target.value)}
                        className="px-2.5 py-1 bg-[#f6f9f7] rounded-lg border border-[#e3ece7] text-xs text-[#14221b]"
                    />
                </div>

                <Tombol
                    varian="secondary"
                    ukuran="sm"
                    ikon={<Download className="w-3.5 h-3.5 mr-1" />}
                    onClick={handleEksporCsv}
                >
                    Unduh CSV Excel
                </Tombol>
            </Kartu>

            {/* TAB 1: REKAP PENJUALAN */}
            {tabAktif === 'penjualan' && (
                <Kartu className="p-0 overflow-hidden">
                    {pesanErrorPenjualan && <div className="p-4"><PesanKesalahan pesan={pesanErrorPenjualan} /></div>}

                    {sedangMemuatPenjualan ? (
                        <div className="p-4">
                            <SkeletonTabel baris={6} kolom={7} />
                        </div>
                    ) : daftarPenjualan.length === 0 ? (
                        <div className="p-8">
                            <PanelKosong
                                judul="Tidak Ada Data Transaksi"
                                deskripsi={`Belum ada transaksi penjualan pada rentang tanggal ${tanggalAwal} s/d ${tanggalAkhir}.`}
                            />
                        </div>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px] text-[#14221b]">
                                <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                                    <tr>
                                        <th className="px-4 py-3">No. Nota</th>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">Kasir</th>
                                        <th className="px-4 py-3">Pelanggan</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                        <th className="px-4 py-3 text-right">Total Akhir</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eef3f0]">
                                    {daftarPenjualan.map((p) => (
                                        <tr key={p.id} className="hover:bg-[#f6f9f7]/60 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-[#007b40]">
                                                {p.nomor}
                                            </td>
                                            <td className="px-4 py-3 text-[#5f756b]">
                                                {new Date(p.waktu_penjualan).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-[#5f756b]">
                                                {p.shift_kasir?.pengguna?.nama || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {p.pelanggan?.nama || 'Umum'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#5f756b]">
                                                {formatRp(p.subtotal_rp)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-[#14221b]">
                                                {formatRp(p.total_rp)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge varian={p.status === 'selesai' ? 'sukses' : 'peringatan'}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Paginasi daftar={laporanPenjualan} className="px-4 py-3 border-t border-[#eef3f0]" />
                        </>
                    )}
                </Kartu>
            )}

            {/* TAB 2: LAPORAN LABA RUGI OPERASIONAL */}
            {tabAktif === 'laba_rugi' && (
                <div className="space-y-4">
                    {pesanErrorLabaRugi && <PesanKesalahan pesan={pesanErrorLabaRugi} />}

                    {sedangMemuatLabaRugi ? (
                        <div className="h-64 bg-white rounded-2xl border border-[#edf2ef] shadow-kartu animate-pulse" />
                    ) : !dataLabaRugi ? (
                        <PanelKosong judul="Laporan Belum Siap" deskripsi="Pilih periode tanggal yang sesuai." />
                    ) : (
                        <div className="space-y-4">
                            {/* KARTU HIGHLIGHT LABA */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Kartu className="p-4">
                                    <span className="text-xs font-semibold text-[#5f756b]">Penjualan Bersih</span>
                                    <div className="text-lg font-bold text-[#14221b] mt-1">
                                        {formatRp(dataLabaRugi.pendapatan.penjualan_bersih_rp)}
                                    </div>
                                    <span className="text-[10px] text-[#5f756b]">Setelah dikurangi diskon & retur</span>
                                </Kartu>

                                <Kartu className="p-4">
                                    <span className="text-xs font-semibold text-[#5f756b]">Laba Kotor (Gross Margin)</span>
                                    <div className="text-lg font-bold text-blue-600 mt-1">
                                        {formatRp(dataLabaRugi.laba_kotor_rp)}
                                    </div>
                                    <span className="text-[10px] text-[#5f756b]">Setelah dikurangi HPP aktual lot</span>
                                </Kartu>

                                <Kartu className="p-4 bg-emerald-50 border-[#c3eed7]">
                                    <span className="text-xs font-semibold text-[#007b40]">Laba Bersih Operasional</span>
                                    <div className="text-xl font-extrabold text-[#007b40] mt-1">
                                        {formatRp(dataLabaRugi.laba_bersih_rp)}
                                    </div>
                                    <span className="text-[11px] font-semibold text-[#009f52]">
                                        Margin Bersih: {dataLabaRugi.margin_bersih_persen}%
                                    </span>
                                </Kartu>
                            </div>

                            {/* TABEL STRUKTUR LABA RUGI RESMI */}
                            <Kartu className="p-5">
                                <h3 className="text-sm font-bold text-[#14221b] pb-3 border-b border-[#e3ece7]">
                                    Laporan Laba Rugi Periode {tanggalAwal} s/d {tanggalAkhir}
                                </h3>

                                <div className="space-y-3 pt-3 text-xs">
                                    {/* 1. PENDAPATAN */}
                                    <div className="space-y-1.5">
                                        <div className="font-bold text-[#14221b] uppercase tracking-wider text-[11px]">
                                            1. Pendapatan Penjualan
                                        </div>
                                        <div className="flex justify-between pl-4 text-[#5f756b]">
                                            <span>Penjualan Kotor (Subtotal)</span>
                                            <span>{formatRp(dataLabaRugi.pendapatan.penjualan_kotor_rp)}</span>
                                        </div>
                                        <div className="flex justify-between pl-4 text-[#5f756b]">
                                            <span>Diskon Penjualan</span>
                                            <span className="text-red-600">-{formatRp(dataLabaRugi.pendapatan.diskon_penjualan_rp)}</span>
                                        </div>
                                        <div className="flex justify-between pl-4 text-[#5f756b]">
                                            <span>Retur Penjualan & Refund</span>
                                            <span className="text-red-600">-{formatRp(dataLabaRugi.pendapatan.retur_penjualan_rp)}</span>
                                        </div>
                                        <div className="flex justify-between pl-4 font-semibold text-[#14221b] pt-1 border-t border-[#e3ece7]">
                                            <span>Penjualan Bersih</span>
                                            <span>{formatRp(dataLabaRugi.pendapatan.penjualan_bersih_rp)}</span>
                                        </div>
                                    </div>

                                    {/* 2. HPP */}
                                    <div className="space-y-1.5 pt-2">
                                        <div className="font-bold text-[#14221b] uppercase tracking-wider text-[11px]">
                                            2. Harga Pokok Penjualan (HPP)
                                        </div>
                                        <div className="flex justify-between pl-4 text-[#5f756b]">
                                            <span>HPP Aktual Lot FEFO yang Terjual</span>
                                            <span className="text-red-600">-{formatRp(dataLabaRugi.harga_pokok_penjualan.hpp_aktual_fefo_rp)}</span>
                                        </div>
                                        <div className="flex justify-between pl-4 font-bold text-blue-600 pt-1 border-t border-[#e3ece7]">
                                            <span>LABA KOTOR (GROSS PROFIT)</span>
                                            <span>{formatRp(dataLabaRugi.laba_kotor_rp)}</span>
                                        </div>
                                    </div>

                                    {/* 3. BEBAN OPERASIONAL / SUSUT */}
                                    <div className="space-y-1.5 pt-2">
                                        <div className="font-bold text-[#14221b] uppercase tracking-wider text-[11px]">
                                            3. Beban Operasional / Kerugian Susut
                                        </div>
                                        <div className="flex justify-between pl-4 text-[#5f756b]">
                                            <span>Biaya Kerugian Sayur Rusak/Limbah Busuk</span>
                                            <span className="text-red-600">-{formatRp(dataLabaRugi.beban_operasional.biaya_susut_sayur_rp)}</span>
                                        </div>
                                    </div>

                                    {/* 4. LABA BERSIH */}
                                    <div className="pt-3 border-t-2 border-[#14221b] flex justify-between font-extrabold text-sm text-[#007b40]">
                                        <span>LABA BERSIH OPERASIONAL</span>
                                        <span>{formatRp(dataLabaRugi.laba_bersih_rp)}</span>
                                    </div>
                                </div>
                            </Kartu>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
