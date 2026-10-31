import React, { useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { PEGAS, PEGAS_LEMBUT } from '@/komponen/ui/Animasi';
import { formatRupiah } from '@/util/formatRupiah';
import { cn } from '@/util/kelas';
import type { TrenPenjualan } from '@/tipe';

// Ramp satu hue, gelap ke terang: warna menandai peringkat (terbesar = tergelap).
export const RAMP_HIJAU = ['#065c34', '#0a7a43', '#1f9a5f', '#5cbd8b'];
export const WARNA_LAINNYA = '#b4c0b9';
export const WARNA_OMZET = '#0aa35a';
export const WARNA_LABA = '#065c34';

export const formatRpRingkas = (nilai: number | string): string => {
    const angka = new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(Number(nilai) || 0);
    return `Rp ${angka}`;
};

const formatPersen = (nilai: number): string =>
    `${nilai.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;

export const BadgePerubahan: React.FC<{
    persen: number | null;
    adaNilai: boolean;
    className?: string;
}> = ({ persen, adaNilai, className }) => {
    const basis = 'inline-flex items-center justify-center min-w-[64px] px-2.5 h-7 rounded-full text-xs font-bold tabular-nums';
    const pop = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 460, damping: 20, delay: 0.3 },
    } as const;

    if (persen === null) {
        if (!adaNilai) return null;
        return (
            <motion.span {...pop} className={cn(basis, 'bg-white/70 text-[#3d4f46]', className)} title="Belum ada data pembanding">
                Baru
            </motion.span>
        );
    }

    if (persen === 0) {
        return <motion.span {...pop} className={cn(basis, 'bg-[#e3e8e5] text-[#3d4f46]', className)}>0%</motion.span>;
    }

    const naik = persen > 0;
    return (
        <motion.span {...pop} className={cn(basis, naik ? 'bg-[#43d11a] text-[#0d2a12]' : 'bg-[#e5121b] text-white', className)}>
            {naik ? '+' : '−'}
            {formatPersen(Math.abs(persen))}
        </motion.span>
    );
};

export const PilihPeriode: React.FC<{
    nilai: string;
    opsi: { nilai: string; label: string }[];
    padaUbah: (nilai: string) => void;
    label: string;
}> = ({ nilai, opsi, padaUbah, label }) => (
    <div className="group relative shrink-0">
        <select
            aria-label={label}
            value={nilai}
            onChange={(e) => padaUbah(e.target.value)}
            className="appearance-none bg-transparent text-sm font-semibold text-[#14221b] pl-1 pr-7 h-8 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009f52]"
        >
            {opsi.map((o) => (
                <option key={o.nilai} value={o.nilai}>
                    {o.label}
                </option>
            ))}
        </select>
        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#14221b]/10 flex items-center justify-center pointer-events-none transition-[background-color,rotate] duration-200 group-hover:bg-[#14221b]/20 group-hover:rotate-180">
            <ChevronDown className="w-3.5 h-3.5 text-[#14221b]" />
        </span>
    </div>
);

export const GrafikKosong: React.FC<{ pesan?: string; className?: string }> = ({
    pesan = 'Belum ada penjualan pada periode ini.',
    className,
}) => (
    <div className={cn('flex items-center justify-center text-center text-sm text-[#5f756b] animate-muncul-naik', className)}>
        {pesan}
    </div>
);

interface PosisiTooltip {
    kiri: number | string;
    atas: number | string;
    geserX: string;
    geserY: string;
}

// Satu tooltip berpindah antar elemen dengan pegas, bukan muncul-hilang di tiap elemen.
const TooltipGrafik: React.FC<{
    posisi: PosisiTooltip;
    judul: string;
    baris: { label: string; nilai: string; warna: string }[];
}> = ({ posisi, judul, baris }) => {
    const target = { left: posisi.kiri, top: posisi.atas, x: posisi.geserX, y: posisi.geserY };

    return (
        <motion.div
            role="status"
            initial={{ ...target, opacity: 0, scale: 0.94 }}
            animate={{ ...target, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
            transition={PEGAS}
            className="absolute z-20 pointer-events-none bg-white rounded-xl shadow-xl border border-[#edf2ef] px-3 py-2 min-w-[150px]"
        >
            <div className="text-[11px] font-medium text-[#5f756b] mb-1 whitespace-nowrap">{judul}</div>
            {baris.map((b) => (
                <div key={b.label} className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: b.warna }} />
                    <span className="text-sm font-bold text-[#14221b] tabular-nums">{b.nilai}</span>
                    <span className="text-[11px] text-[#5f756b]">{b.label}</span>
                </div>
            ))}
        </motion.div>
    );
};

function skalaRapi(maks: number): number[] {
    if (maks <= 0) return [0];
    const kasar = maks / 4;
    const pangkat = 10 ** Math.floor(Math.log10(kasar));
    const faktor = kasar / pangkat;
    const langkah = (faktor <= 1 ? 1 : faktor <= 2 ? 2 : faktor <= 2.5 ? 2.5 : faktor <= 5 ? 5 : 10) * pangkat;
    const jumlah = Math.ceil(maks / langkah);
    return Array.from({ length: jumlah + 1 }, (_, i) => i * langkah);
}

const Batang: React.FC<{ nilai: number; batas: number; warna: string; jeda: number }> = ({
    nilai,
    batas,
    warna,
    jeda,
}) => {
    if (nilai <= 0) return null;
    return (
        <motion.span
            className="block w-[clamp(10px,2vw,24px)] rounded-full"
            initial={{ height: '0%' }}
            animate={{ height: `${(nilai / batas) * 100}%` }}
            transition={{ ...PEGAS_LEMBUT, delay: jeda }}
            style={{ minHeight: 6, backgroundColor: warna }}
        />
    );
};

export const GrafikBatangGanda: React.FC<{ data: TrenPenjualan[] }> = ({ data }) => {
    const wadahRef = useRef<HTMLDivElement>(null);
    const [aktif, setAktif] = useState<{ indeks: number; posisi: PosisiTooltip } | null>(null);

    const maks = Math.max(0, ...data.flatMap((d) => [Number(d.omzet_rp), Number(d.laba_kotor_rp)]));
    const tik = skalaRapi(maks);
    const batas = tik[tik.length - 1] || 1;

    // Tooltip diletakkan di samping kelompok agar batang yang dibaca tidak tertutup.
    const tampilkan = (indeks: number, elemen: Element) => {
        if (!wadahRef.current) return;
        const kotakWadah = wadahRef.current.getBoundingClientRect();
        const kotak = elemen.getBoundingClientRect();
        const kiri = kotak.left - kotakWadah.left;
        const diKanan = kiri + kotak.width / 2 > kotakWadah.width / 2;

        setAktif({
            indeks,
            posisi: {
                kiri: diKanan ? kiri - 6 : Math.min(kiri + kotak.width + 6, Math.max(0, kotakWadah.width - 170)),
                atas: 8,
                geserX: diKanan ? '-100%' : '0%',
                geserY: '0%',
            },
        });
    };

    const barisAktif = aktif ? data[aktif.indeks] : null;

    return (
        <div className="flex flex-1 gap-2 min-w-0">
            <div className="relative w-12 shrink-0 text-xs text-[#5f756b] tabular-nums" aria-hidden>
                <div className="absolute inset-x-0 top-0 bottom-8">
                    {tik.map((t, i) => (
                        <span
                            key={i}
                            className="absolute right-0 translate-y-1/2 whitespace-nowrap transition-[bottom] duration-500 ease-out"
                            style={{ bottom: `${(t / batas) * 100}%` }}
                        >
                            {t === 0 ? '0' : formatRpRingkas(t).replace('Rp ', '')}
                        </span>
                    ))}
                </div>
            </div>

            <div ref={wadahRef} className="relative flex-1 min-w-0 flex flex-col">
                <div className="relative flex-1">
                    {tik.map((t, i) => (
                        <span
                            key={i}
                            className="absolute inset-x-0 border-t border-[#eef3f0] transition-[bottom] duration-500 ease-out"
                            style={{ bottom: `${(t / batas) * 100}%` }}
                        />
                    ))}

                    <div className="absolute inset-0 flex">
                        {data.map((d, i) => (
                            <div
                                key={d.tanggal}
                                role="img"
                                tabIndex={0}
                                aria-label={`${d.label}: omzet ${formatRupiah(d.omzet_rp)}, laba kotor ${formatRupiah(d.laba_kotor_rp)}, ${d.total_transaksi} transaksi`}
                                onMouseEnter={(e) => tampilkan(i, e.currentTarget)}
                                onMouseLeave={() => setAktif(null)}
                                onFocus={(e) => tampilkan(i, e.currentTarget)}
                                onBlur={() => setAktif(null)}
                                className={cn(
                                    'flex-1 min-w-0 h-full flex items-end justify-center gap-[clamp(3px,0.5vw,8px)] rounded-xl outline-none transition-[opacity,background-color] duration-200',
                                    aktif?.indeks === i && 'bg-[#eefaf3]',
                                    aktif && aktif.indeks !== i && 'opacity-45'
                                )}
                            >
                                <Batang nilai={Number(d.omzet_rp)} batas={batas} warna={WARNA_OMZET} jeda={i * 0.05} />
                                <Batang nilai={Number(d.laba_kotor_rp)} batas={batas} warna={WARNA_LABA} jeda={i * 0.05 + 0.04} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex h-8 items-end shrink-0">
                    {data.map((d, i) => (
                        <span
                            key={d.tanggal}
                            className={cn(
                                'flex-1 min-w-0 text-center text-sm truncate transition-colors duration-200',
                                aktif?.indeks === i ? 'text-[#007b40] font-semibold' : 'text-[#5f756b]'
                            )}
                        >
                            {d.label}
                        </span>
                    ))}
                </div>

                <AnimatePresence>
                    {aktif && barisAktif && (
                        <TooltipGrafik
                            key="tooltip-batang"
                            posisi={aktif.posisi}
                            judul={`${barisAktif.label} · ${barisAktif.total_transaksi} transaksi`}
                            baris={[
                                { label: 'Omzet', nilai: formatRupiah(barisAktif.omzet_rp), warna: WARNA_OMZET },
                                { label: 'Laba kotor', nilai: formatRupiah(barisAktif.laba_kotor_rp), warna: WARNA_LABA },
                            ]}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export interface IrisanPie {
    nama: string;
    nilai: number;
    persen: number;
    warna: string;
}

function jalurIrisan(sudutAwal: number, sudutAkhir: number, r: number): string {
    const x1 = r * Math.cos(sudutAwal);
    const y1 = r * Math.sin(sudutAwal);
    const x2 = r * Math.cos(sudutAkhir);
    const y2 = r * Math.sin(sudutAkhir);
    const busurBesar = sudutAkhir - sudutAwal > Math.PI ? 1 : 0;
    return `M0 0L${x1} ${y1}A${r} ${r} 0 ${busurBesar} 1 ${x2} ${y2}Z`;
}

const JARI_PIE = 100;
const SISI_KANVAS_PIE = 114;
const JARAK_LOMPAT_IRISAN = 9;

export const DiagramPie: React.FC<{
    irisan: IrisanPie[];
    aktif: number | null;
    padaAktif: (indeks: number | null) => void;
}> = ({ irisan, aktif, padaAktif }) => {
    const idMask = `sapuan-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const kurangiGerak = useReducedMotion();
    const total = irisan.reduce((jumlah, i) => jumlah + i.nilai, 0);

    let sudut = -Math.PI / 2;
    const bentuk = irisan.map((i) => {
        const awal = sudut;
        const lebar = total > 0 ? (i.nilai / total) * Math.PI * 2 : 0;
        sudut += lebar;
        return { ...i, awal, akhir: sudut, tengah: awal + lebar / 2, utuh: lebar >= Math.PI * 2 - 0.001 };
    });

    const irisanAktif = aktif !== null ? bentuk[aktif] : null;
    const tandaData = irisan.map((i) => `${i.nama}:${i.nilai}`).join('|');

    return (
        <div className="relative w-full max-w-[270px] mx-auto aspect-square">
            <svg
                viewBox={`${-SISI_KANVAS_PIE} ${-SISI_KANVAS_PIE} ${SISI_KANVAS_PIE * 2} ${SISI_KANVAS_PIE * 2}`}
                className="w-full h-full overflow-visible"
            >
                <defs>
                    <mask id={idMask}>
                        <g transform="rotate(-90)">
                            {/* Lingkaran bergaris tebal: panjang garisnya menyapu seluruh pie */}
                            <motion.circle
                                key={tandaData}
                                r={SISI_KANVAS_PIE / 2}
                                fill="none"
                                stroke="white"
                                strokeWidth={SISI_KANVAS_PIE}
                                initial={{ pathLength: kurangiGerak ? 1 : 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                            />
                        </g>
                    </mask>
                </defs>

                <g mask={`url(#${idMask})`}>
                    {bentuk.map((b, i) => {
                        const menonjol = aktif === i && !b.utuh;
                        const sifat = {
                            fill: b.warna,
                            stroke: '#eaf3ed',
                            strokeWidth: 1.5,
                            role: 'img',
                            tabIndex: 0,
                            'aria-label': `${b.nama}: ${formatPersen(b.persen)}, ${formatRupiah(b.nilai)}`,
                            className: 'outline-none cursor-pointer',
                            animate: {
                                x: menonjol ? Math.cos(b.tengah) * JARAK_LOMPAT_IRISAN : 0,
                                y: menonjol ? Math.sin(b.tengah) * JARAK_LOMPAT_IRISAN : 0,
                                opacity: aktif !== null && aktif !== i ? 0.5 : 1,
                            },
                            transition: PEGAS,
                            onMouseEnter: () => padaAktif(i),
                            onMouseLeave: () => padaAktif(null),
                            onFocus: () => padaAktif(i),
                            onBlur: () => padaAktif(null),
                        };
                        return b.utuh ? (
                            <motion.circle key={b.nama} r={JARI_PIE} {...sifat} />
                        ) : (
                            <motion.path key={b.nama} d={jalurIrisan(b.awal, b.akhir, JARI_PIE)} {...sifat} />
                        );
                    })}
                </g>
            </svg>

            <AnimatePresence>
                {irisanAktif && (
                    <TooltipGrafik
                        key="tooltip-pie"
                        posisi={{
                            kiri: `${50 + Math.cos(irisanAktif.tengah) * 27}%`,
                            atas: `${50 + Math.sin(irisanAktif.tengah) * 27}%`,
                            geserX: '-50%',
                            geserY: '-100%',
                        }}
                        judul={irisanAktif.nama}
                        baris={[{ label: formatPersen(irisanAktif.persen), nilai: formatRupiah(irisanAktif.nilai), warna: irisanAktif.warna }]}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export interface GelembungMetode {
    jenis: string;
    nama: string;
    persen: number;
    warna: string;
    warnaTeks: string;
}

// Sudut gelembung satelit terhadap gelembung terbesar (derajat, searah jarum jam).
const SUDUT_SATELIT = [-52, 8, 72];

export const DiagramGelembung: React.FC<{
    data: GelembungMetode[];
    aktif: string | null;
    padaAktif: (jenis: string | null) => void;
}> = ({ data, aktif, padaAktif }) => {
    const urut = [...data].sort((a, b) => b.persen - a.persen).slice(0, 4);
    const JARI_UTAMA = 62;
    const terbesar = urut[0]?.persen || 1;

    const lingkaran = urut.map((d, i) => {
        const r = Math.max(JARI_UTAMA * Math.sqrt(d.persen / terbesar), 20);
        if (i === 0) return { ...d, r, x: 0, y: 0 };
        const sudut = (SUDUT_SATELIT[i - 1] * Math.PI) / 180;
        const jarak = JARI_UTAMA + r * 0.72;
        return { ...d, r, x: jarak * Math.cos(sudut), y: jarak * Math.sin(sudut) };
    });

    const kiri = Math.min(...lingkaran.map((l) => l.x - l.r)) - 8;
    const atas = Math.min(...lingkaran.map((l) => l.y - l.r)) - 8;
    const kanan = Math.max(...lingkaran.map((l) => l.x + l.r)) + 8;
    const bawah = Math.max(...lingkaran.map((l) => l.y + l.r)) + 8;

    return (
        <svg
            viewBox={`${kiri} ${atas} ${kanan - kiri} ${bawah - atas}`}
            className="w-full max-h-48 overflow-visible"
            role="img"
            aria-label={urut.map((d) => `${d.nama} ${formatPersen(d.persen)}`).join(', ')}
        >
            {lingkaran.map((l, i) => (
                <g key={l.jenis} transform={`translate(${l.x} ${l.y})`}>
                    <g
                        className="animate-mengambang"
                        style={{ animationDelay: `${i * -0.9}s`, transformBox: 'fill-box', transformOrigin: 'center' }}
                    >
                        <motion.g
                            className="cursor-pointer"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: aktif === l.jenis ? 1.09 : 1,
                                opacity: aktif !== null && aktif !== l.jenis ? 0.55 : 1,
                            }}
                            transition={{ ...PEGAS_LEMBUT, delay: aktif === null ? i * 0.09 : 0 }}
                            onMouseEnter={() => padaAktif(l.jenis)}
                            onMouseLeave={() => padaAktif(null)}
                        >
                            <title>{`${l.nama}: ${formatPersen(l.persen)}`}</title>
                            <circle r={l.r} fill={l.warna} stroke="#ffffff" strokeWidth={2} />
                            <text
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={l.warnaTeks}
                                fontWeight={700}
                                fontSize={Math.min(Math.max(l.r * 0.42, 12), 22)}
                            >
                                {Math.round(l.persen)}%
                            </text>
                        </motion.g>
                    </g>
                </g>
            ))}
        </svg>
    );
};
