import React, { useEffect, useState } from 'react';
import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from 'motion/react';
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    Clock,
    Package,
    ReceiptText,
    ShoppingBasket,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { apiClient } from '@/layanan/apiClient';
import type {
    PangsaKategori,
    PangsaMetodeBayar,
    RingkasanDashboard,
    TopProdukDashboard,
    TrenPenjualan,
} from '@/tipe';
import { Kartu } from '@/komponen/ui/Kartu';
import { Tombol } from '@/komponen/ui/Tombol';
import { Skeleton } from '@/komponen/ui/Skeleton';
import { AngkaBerjalan, PEGAS, PEGAS_LEMBUT } from '@/komponen/ui/Animasi';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';
import { formatRupiah } from '@/util/formatRupiah';
import { cn } from '@/util/kelas';
import {
    BadgePerubahan,
    DiagramGelembung,
    DiagramPie,
    GrafikBatangGanda,
    GrafikKosong,
    PilihPeriode,
    RAMP_HIJAU,
    WARNA_LABA,
    WARNA_LAINNYA,
    WARNA_OMZET,
    formatRpRingkas,
    type GelembungMetode,
    type IrisanPie,
} from './GrafikDashboard';

const OPSI_PERIODE_TREN = [
    { nilai: '7hari', label: '7 Hari' },
    { nilai: '4minggu', label: '4 Minggu' },
    { nilai: '6bulan', label: '6 Bulan' },
];

const OPSI_PERIODE_PANGSA = [
    { nilai: 'hari_ini', label: 'Hari Ini' },
    { nilai: '7hari', label: '7 Hari' },
    { nilai: '30hari', label: '30 Hari' },
];

const LABEL_METODE: Record<string, { nama: string; warna: string; warnaTeks: string }> = {
    tunai: { nama: 'Tunai', warna: RAMP_HIJAU[0], warnaTeks: '#ffffff' },
    qris: { nama: 'QRIS', warna: RAMP_HIJAU[1], warnaTeks: '#ffffff' },
    kartu: { nama: 'Kartu Debit', warna: RAMP_HIJAU[2], warnaTeks: '#ffffff' },
    transfer: { nama: 'Transfer', warna: RAMP_HIJAU[3], warnaTeks: '#0d2a12' },
};

// Muat data satu kartu; saat periode berganti, data lama tetap tampil sampai data baru tiba.
function useDataDashboard<T>(url: string, nilaiAwal: T, periode?: string) {
    const [data, setData] = useState<T>(nilaiAwal);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState<string | null>(null);
    const [percobaan, setPercobaan] = useState(0);

    useEffect(() => {
        let masihBerlaku = true;
        setMemuat(true);
        setGalat(null);

        apiClient
            .get(url, { params: periode ? { periode } : undefined })
            .then((res) => {
                if (masihBerlaku) setData(res.data.data);
            })
            .catch((err: any) => {
                if (masihBerlaku) setGalat(err.response?.data?.pesan || 'Gagal memuat data dashboard.');
            })
            .finally(() => {
                if (masihBerlaku) setMemuat(false);
            });

        return () => {
            masihBerlaku = false;
        };
    }, [url, periode, percobaan]);

    return { data, memuat, galat, ulangi: () => setPercobaan((n) => n + 1) };
}

const formatRupiahBulat = (nilai: number): string => formatRupiah(Math.round(nilai));
const formatBilangan = (nilai: number): string => Math.round(nilai).toLocaleString('id-ID');

interface KartuKpiProps {
    urutan: number;
    ikon: React.ReactNode;
    label: string;
    nilai: number;
    format: (nilai: number) => string;
    keterangan: string;
    persen: number | null;
    utama?: boolean;
}

const PEGAS_MIRING = { stiffness: 180, damping: 18 };

const KartuKpi: React.FC<KartuKpiProps> = ({ urutan, ikon, label, nilai, format, keterangan, persen, utama = false }) => {
    const kurangiGerak = useReducedMotion();
    const kursorX = useMotionValue(0);
    const kursorY = useMotionValue(0);

    const miringX = useSpring(useTransform(kursorY, [-0.5, 0.5], [5, -5]), PEGAS_MIRING);
    const miringY = useSpring(useTransform(kursorX, [-0.5, 0.5], [-6, 6]), PEGAS_MIRING);
    const polaX = useSpring(useTransform(kursorX, [-0.5, 0.5], [-10, 10]), PEGAS_MIRING);
    const polaY = useSpring(useTransform(kursorY, [-0.5, 0.5], [-8, 8]), PEGAS_MIRING);
    const persenX = useTransform(kursorX, [-0.5, 0.5], [0, 100]);
    const persenY = useTransform(kursorY, [-0.5, 0.5], [0, 100]);
    const sorotan = useMotionTemplate`radial-gradient(220px circle at ${persenX}% ${persenY}%, ${utama ? 'rgb(255 255 255 / 0.16)' : 'rgb(0 159 82 / 0.10)'}, transparent 70%)`;

    const ikutiKursor = (e: React.PointerEvent<HTMLDivElement>) => {
        if (kurangiGerak || e.pointerType !== 'mouse') return;
        const kotak = e.currentTarget.getBoundingClientRect();
        kursorX.set((e.clientX - kotak.left) / kotak.width - 0.5);
        kursorY.set((e.clientY - kotak.top) / kotak.height - 0.5);
    };

    const lepasKursor = () => {
        kursorX.set(0);
        kursorY.set(0);
    };

    return (
        <Kartu
            custom={urutan}
            whileHover={{ y: -4 }}
            onPointerMove={ikutiKursor}
            onPointerLeave={lepasKursor}
            style={{ rotateX: miringX, rotateY: miringY, transformPerspective: 900 }}
            className={cn(
                'group relative overflow-hidden rounded-3xl p-5 min-h-[172px] flex flex-col justify-between hover:shadow-kartu-angkat',
                utama && 'bg-[#0b4a2b] border-transparent text-white'
            )}
        >
            <motion.span
                aria-hidden
                style={{ x: polaX, y: polaY }}
                className={cn(
                    'pola-titik absolute -inset-y-3 -right-3 w-[80%]',
                    utama ? 'text-white/[0.06]' : 'text-[#14221b]/[0.05]'
                )}
            />
            <motion.span
                aria-hidden
                style={{ background: sorotan }}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />

            <div className="relative flex items-start justify-between gap-3">
                <div
                    className={cn(
                        'w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 transition-[scale,rotate] duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6',
                        utama ? 'bg-white text-[#0b4a2b]' : 'bg-[#e8ecea] text-[#14221b]'
                    )}
                >
                    {ikon}
                </div>
                <BadgePerubahan persen={persen} adaNilai={nilai > 0} />
            </div>

            <div className="relative mt-4">
                <p className={cn('text-sm font-medium', utama ? 'text-white/90' : 'text-[#14221b]')}>{label}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4">
                    <AngkaBerjalan
                        nilai={nilai}
                        format={format}
                        className="text-[28px] xl:text-[34px] leading-tight font-extrabold tabular-nums"
                    />
                    <span
                        className={cn(
                            'text-xs leading-snug whitespace-pre-line',
                            utama ? 'text-white/80' : 'text-[#3d4f46]'
                        )}
                    >
                        {keterangan}
                    </span>
                </div>
            </div>
        </Kartu>
    );
};

const JudulKartu: React.FC<{ judul: string; deskripsi: string; children?: React.ReactNode }> = ({
    judul,
    deskripsi,
    children,
}) => (
    <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#14221b] leading-tight">{judul}</h2>
            <p className="text-sm text-[#5f756b] mt-0.5">{deskripsi}</p>
        </div>
        {children}
    </div>
);

const BarisStatus: React.FC<{ ikon: React.ReactNode; label: string; children: React.ReactNode }> = ({
    ikon,
    label,
    children,
}) => (
    <div className="group flex-1 flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0 text-sm text-[#3d4f46]">
            <span className="text-[#5f756b] shrink-0 transition-[scale,color] duration-200 group-hover:scale-125 group-hover:text-[#009f52]">{ikon}</span>
            <span className="truncate">{label}</span>
        </div>
        <div className="text-sm font-bold text-[#14221b] tabular-nums shrink-0">{children}</div>
    </div>
);

export function HalamanDashboard({
    padaPilihHalaman,
}: {
    padaPilihHalaman: (halaman: string) => void;
}) {
    const [periodeTren, setPeriodeTren] = useState('7hari');
    const [periodeKategori, setPeriodeKategori] = useState('7hari');
    const [periodeMetode, setPeriodeMetode] = useState('7hari');

    const ringkasan = useDataDashboard<RingkasanDashboard | null>('/dashboard/ringkasan', null);
    const tren = useDataDashboard<TrenPenjualan[]>('/dashboard/grafik-penjualan', [], periodeTren);
    const kategori = useDataDashboard<PangsaKategori | null>('/dashboard/penjualan-kategori', null, periodeKategori);
    const metode = useDataDashboard<PangsaMetodeBayar | null>('/dashboard/metode-bayar', null, periodeMetode);
    const terlaris = useDataDashboard<TopProdukDashboard[]>('/dashboard/top-produk', []);

    const [kategoriAktif, setKategoriAktif] = useState<number | null>(null);
    const [metodeAktif, setMetodeAktif] = useState<string | null>(null);

    const r = ringkasan.data;
    const adaTren = tren.data.some((d) => Number(d.omzet_rp) > 0);

    const irisanKategori: IrisanPie[] = (kategori.data?.kategori ?? []).map((k, i) => ({
        nama: k.nama,
        nilai: Number(k.omzet_rp),
        persen: k.persen,
        warna: k.nama === 'Lainnya' ? WARNA_LAINNYA : RAMP_HIJAU[i] ?? WARNA_LAINNYA,
    }));

    const daftarMetode: GelembungMetode[] = (metode.data?.metode ?? []).map((m) => {
        const info = LABEL_METODE[m.jenis] ?? { nama: m.jenis, warna: WARNA_LAINNYA, warnaTeks: '#0d2a12' };
        return { jenis: m.jenis, nama: info.nama, persen: m.persen, warna: info.warna, warnaTeks: info.warnaTeks };
    });

    return (
        <div className="space-y-3">
            {ringkasan.galat && <PesanKesalahan pesan={ringkasan.galat} padaUlangi={ringkasan.ulangi} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* KIRI: KPI & TREN */}
                <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {!r && ringkasan.memuat ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-[172px] rounded-3xl" />
                            ))
                        ) : (
                            <>
                                <KartuKpi
                                    utama
                                    urutan={0}
                                    ikon={<ReceiptText className="w-6 h-6" />}
                                    label="Omzet Bersih"
                                    nilai={Number(r?.omzet_bersih_rp) || 0}
                                    format={formatRupiahBulat}
                                    keterangan={'Hari ini vs\nkemarin'}
                                    persen={r?.perubahan_persen.omzet ?? null}
                                />
                                <KartuKpi
                                    urutan={1}
                                    ikon={<ShoppingCart className="w-6 h-6" />}
                                    label="Total Transaksi"
                                    nilai={r?.total_transaksi ?? 0}
                                    format={formatBilangan}
                                    keterangan={'Transaksi vs\nkemarin'}
                                    persen={r?.perubahan_persen.transaksi ?? null}
                                />
                                <KartuKpi
                                    urutan={2}
                                    ikon={<TrendingUp className="w-6 h-6" />}
                                    label="Laba Kotor"
                                    nilai={Number(r?.laba_kotor_rp) || 0}
                                    format={formatRupiahBulat}
                                    keterangan={`Margin\n${(r?.margin_kotor_persen ?? 0).toLocaleString('id-ID')}%`}
                                    persen={r?.perubahan_persen.laba ?? null}
                                />
                                <KartuKpi
                                    urutan={3}
                                    ikon={<ShoppingBasket className="w-6 h-6" />}
                                    label="Produk Terjual"
                                    nilai={r?.produk_terjual ?? 0}
                                    format={formatBilangan}
                                    keterangan={'Jenis produk\nvs kemarin'}
                                    persen={r?.perubahan_persen.produk ?? null}
                                />
                            </>
                        )}
                    </div>

                    <Kartu className="flex-1 flex flex-col rounded-3xl p-5 sm:p-6">
                        <JudulKartu judul="Tren Penjualan" deskripsi="Omzet bersih dan laba kotor toko">
                            <PilihPeriode
                                label="Periode tren penjualan"
                                nilai={periodeTren}
                                opsi={OPSI_PERIODE_TREN}
                                padaUbah={setPeriodeTren}
                            />
                        </JudulKartu>

                        <div className="flex items-center justify-between gap-3 mt-4 mb-5">
                            <div className="flex items-center gap-4 text-xs text-[#5f756b]">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: WARNA_OMZET }} />
                                    Omzet
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: WARNA_LABA }} />
                                    Laba Kotor
                                </span>
                            </div>
                            <button
                                onClick={() => padaPilihHalaman('laporan')}
                                className="text-xs font-semibold text-[#007b40] hover:underline flex items-center gap-1 shrink-0"
                            >
                                Laporan detail
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {tren.galat ? (
                            <PesanKesalahan pesan={tren.galat} padaUlangi={tren.ulangi} />
                        ) : tren.data.length === 0 ? (
                            <Skeleton className="flex-1 min-h-[280px] rounded-2xl" />
                        ) : !adaTren && !tren.memuat ? (
                            <GrafikKosong className="flex-1 min-h-[280px]" />
                        ) : (
                            <div className={cn('flex flex-1 min-h-[280px] transition-opacity duration-300', tren.memuat && 'opacity-50')}>
                                <GrafikBatangGanda data={tren.data} />
                            </div>
                        )}
                    </Kartu>
                </div>

                {/* KANAN: PANGSA KATEGORI & METODE BAYAR */}
                <div className="flex flex-col gap-3 min-w-0">
                    <Kartu className="flex-1 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white via-[#e2efe7] to-[#b5d2c1] shadow-kartu-angkat">
                        <JudulKartu judul="Statistik Kategori" deskripsi="Penjualan per kategori produk">
                            <PilihPeriode
                                label="Periode statistik kategori"
                                nilai={periodeKategori}
                                opsi={OPSI_PERIODE_PANGSA}
                                padaUbah={setPeriodeKategori}
                            />
                        </JudulKartu>

                        {kategori.galat ? (
                            <PesanKesalahan className="mt-4" pesan={kategori.galat} padaUlangi={kategori.ulangi} />
                        ) : !kategori.data ? (
                            <Skeleton className="w-52 h-52 rounded-full mx-auto mt-6" />
                        ) : irisanKategori.length === 0 ? (
                            <GrafikKosong className="h-56" />
                        ) : (
                            <div className={cn('transition-opacity duration-300', kategori.memuat && 'opacity-50')}>
                                <div className="mt-5 mb-5">
                                    <DiagramPie irisan={irisanKategori} aktif={kategoriAktif} padaAktif={setKategoriAktif} />
                                </div>
                                <ul className="space-y-1.5">
                                    {kategori.data.kategori.map((k, i) => (
                                        <motion.li
                                            key={k.nama}
                                            initial={{ opacity: 0, x: 14 }}
                                            animate={{ opacity: 1, x: kategoriAktif === i ? 4 : 0 }}
                                            transition={{ ...PEGAS, delay: kategoriAktif === null ? i * 0.05 : 0 }}
                                            onMouseEnter={() => setKategoriAktif(i)}
                                            onMouseLeave={() => setKategoriAktif(null)}
                                            className={cn(
                                                'flex items-center gap-2.5 -mx-2 px-2 py-0.5 rounded-lg cursor-default transition-colors duration-150',
                                                kategoriAktif === i && 'bg-white/60'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'w-2.5 h-2.5 rounded-full shrink-0 transition-[scale] duration-200',
                                                    kategoriAktif === i && 'scale-150'
                                                )}
                                                style={{ backgroundColor: irisanKategori[i].warna }}
                                            />
                                            <span className="flex-1 min-w-0 truncate text-sm font-medium text-[#14221b]">
                                                {k.nama}
                                            </span>
                                            <AngkaBerjalan
                                                nilai={Number(k.omzet_rp)}
                                                format={formatRpRingkas}
                                                className="text-sm text-[#14221b] tabular-nums shrink-0"
                                            />
                                            <BadgePerubahan
                                                className="h-6"
                                                persen={k.perubahan_persen}
                                                adaNilai={Number(k.omzet_rp) > 0}
                                            />
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Kartu>

                    <Kartu className="rounded-3xl p-5 sm:p-6">
                        <JudulKartu judul="Metode Bayar" deskripsi="Nilai pembayaran per metode">
                            <PilihPeriode
                                label="Periode metode bayar"
                                nilai={periodeMetode}
                                opsi={OPSI_PERIODE_PANGSA}
                                padaUbah={setPeriodeMetode}
                            />
                        </JudulKartu>

                        {metode.galat ? (
                            <PesanKesalahan className="mt-4" pesan={metode.galat} padaUlangi={metode.ulangi} />
                        ) : !metode.data ? (
                            <Skeleton className="h-40 rounded-2xl mt-4" />
                        ) : daftarMetode.length === 0 ? (
                            <GrafikKosong className="h-40" />
                        ) : (
                            <div className={cn('mt-4 grid grid-cols-2 gap-4 items-center transition-opacity duration-300', metode.memuat && 'opacity-50')}>
                                <DiagramGelembung data={daftarMetode} aktif={metodeAktif} padaAktif={setMetodeAktif} />
                                <ul className="space-y-1.5 min-w-0">
                                    {daftarMetode.map((m, i) => (
                                        <li
                                            key={m.jenis}
                                            onMouseEnter={() => setMetodeAktif(m.jenis)}
                                            onMouseLeave={() => setMetodeAktif(null)}
                                            className={cn(
                                                '-mx-2 px-2 py-1 rounded-lg cursor-default transition-colors duration-150',
                                                metodeAktif === m.jenis && 'bg-[#eefaf3]'
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="truncate text-[#14221b]">{m.nama}</span>
                                                <span className="font-semibold text-[#14221b] tabular-nums">
                                                    {m.persen.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 rounded-full bg-[#e3e8e5] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${m.persen}%` }}
                                                    transition={{ ...PEGAS_LEMBUT, delay: 0.15 + i * 0.08 }}
                                                    style={{ backgroundColor: m.warna }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Kartu>
                </div>
            </div>

            {/* OPERASIONAL TOKO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Kartu className="lg:col-span-2 rounded-3xl p-5 sm:p-6">
                    <JudulKartu judul="Produk Terlaris" deskripsi="Berdasarkan jumlah terjual 30 hari terakhir" />

                    {terlaris.galat ? (
                        <PesanKesalahan className="mt-4" pesan={terlaris.galat} padaUlangi={terlaris.ulangi} />
                    ) : terlaris.memuat && terlaris.data.length === 0 ? (
                        <div className="mt-4 space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-11 rounded-xl" />
                            ))}
                        </div>
                    ) : terlaris.data.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-center text-[#5f756b]">
                            <Package className="w-8 h-8 opacity-40 mb-1.5" />
                            <p className="text-sm">Belum ada data penjualan tercatat.</p>
                        </div>
                    ) : (
                        <ol className="mt-3 divide-y divide-[#eef3f0]">
                            {terlaris.data.map((item, i) => (
                                <motion.li
                                    key={`${item.produk_id}-${item.satuan_snapshot}`}
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ ...PEGAS_LEMBUT, delay: i * 0.06 }}
                                    className="group flex items-center gap-3 py-2.5"
                                >
                                    <span className="w-7 h-7 rounded-full bg-[#e6f8ef] text-[#007b40] text-xs font-bold flex items-center justify-center shrink-0 transition-[scale,background-color,color] duration-200 group-hover:scale-115 group-hover:bg-[#009f52] group-hover:text-white">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-[#14221b] truncate">{item.nama_snapshot}</div>
                                        <div className="text-xs text-[#5f756b]">
                                            Terjual{' '}
                                            {parseFloat(item.total_qty).toLocaleString('id-ID', { maximumFractionDigits: 3 })}{' '}
                                            {item.satuan_snapshot}
                                        </div>
                                    </div>
                                    <AngkaBerjalan
                                        nilai={Number(item.total_omzet_rp)}
                                        format={formatRupiahBulat}
                                        className="text-sm font-bold text-[#14221b] tabular-nums shrink-0"
                                    />
                                </motion.li>
                            ))}
                        </ol>
                    )}
                </Kartu>

                <Kartu className="rounded-3xl p-5 sm:p-6 flex flex-col">
                    <JudulKartu judul="Status Toko" deskripsi="Kondisi operasional hari ini" />

                    <div className="mt-2 flex-1 flex flex-col divide-y divide-[#eef3f0]">
                        <BarisStatus ikon={<Clock className="w-4 h-4" />} label="Shift kasir">
                            <span className={cn('inline-flex items-center gap-2', r?.shift_terbuka ? 'text-[#007b40]' : 'text-[#c25a0c]')}>
                                <span className="relative flex w-2 h-2">
                                    {r?.shift_terbuka && (
                                        <span className="absolute inset-0 rounded-full bg-[#009f52] animate-ping" />
                                    )}
                                    <span className={cn('relative w-2 h-2 rounded-full', r?.shift_terbuka ? 'bg-[#009f52]' : 'bg-[#c25a0c]')} />
                                </span>
                                {r?.shift_terbuka ? 'Buka' : 'Tutup'}
                            </span>
                        </BarisStatus>
                        <BarisStatus ikon={<Wallet className="w-4 h-4" />} label="Kas di laci">
                            <AngkaBerjalan nilai={Number(r?.kas_aktif_rp) || 0} format={formatRupiahBulat} />
                        </BarisStatus>
                        <BarisStatus ikon={<TrendingDown className="w-4 h-4" />} label="Susut hari ini">
                            <AngkaBerjalan nilai={Number(r?.susut_rp) || 0} format={formatRupiahBulat} />
                        </BarisStatus>
                        <BarisStatus ikon={<AlertTriangle className="w-4 h-4" />} label="Stok menipis">
                            <span className={(r?.stok_menipis_count ?? 0) > 0 ? 'text-[#c25a0c]' : undefined}>
                                {r?.stok_menipis_count ?? 0} produk
                            </span>
                        </BarisStatus>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <Tombol
                            varian="primary"
                            ikon={<ShoppingCart className="w-4 h-4" />}
                            onClick={() => padaPilihHalaman('kasir')}
                        >
                            Kasir
                        </Tombol>
                        <Tombol
                            varian="secondary"
                            ikon={<Boxes className="w-4 h-4" />}
                            onClick={() => padaPilihHalaman('stok')}
                        >
                            Stok
                        </Tombol>
                    </div>
                </Kartu>
            </div>
        </div>
    );
}
