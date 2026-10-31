import React, { useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PEGAS } from './Animasi';
import { apiClient, ekstrakPesanError } from '@/layanan/apiClient';
import { cn } from '@/util/kelas';

export interface MetaPaginasi {
    halaman_sekarang: number;
    total_halaman: number;
    total_data: number;
    per_halaman: number;
}

type NilaiFilter = string | number | null | undefined;

interface OpsiDaftar {
    filter?: Record<string, NilaiFilter>;
    perHalaman?: number;
    /** false untuk menunda pemuatan, misalnya tab yang belum dibuka. */
    aktif?: boolean;
}

/** Menunda perubahan nilai supaya pencarian tidak mengirim permintaan di setiap ketikan. */
export function useNilaiTertunda<T>(nilai: T, jedaMs = 350): T {
    const [tertunda, setTertunda] = useState(nilai);

    useEffect(() => {
        const penunda = setTimeout(() => setTertunda(nilai), jedaMs);
        return () => clearTimeout(penunda);
    }, [nilai, jedaMs]);

    return tertunda;
}

/** Memuat satu halaman data dari server; data lama tetap tampil sampai data baru tiba. */
export function useDaftarBerhalaman<T>(url: string, opsi: OpsiDaftar = {}) {
    const { filter, perHalaman: perHalamanAwal = 20, aktif = true } = opsi;

    const [data, setData] = useState<T[]>([]);
    const [meta, setMeta] = useState<MetaPaginasi | null>(null);
    const [halaman, setHalaman] = useState(1);
    const [perHalaman, setPerHalaman] = useState(perHalamanAwal);
    const [memuat, setMemuat] = useState(aktif);
    const [galat, setGalat] = useState<string | null>(null);
    const [percobaan, setPercobaan] = useState(0);

    const kunciFilter = JSON.stringify(
        Object.entries(filter ?? {})
            .filter(([, nilai]) => nilai !== undefined && nilai !== null && nilai !== '')
            .sort()
    );
    const kunciTerakhir = useRef(kunciFilter);

    useEffect(() => {
        if (!aktif) return;

        // Hasil filter baru selalu dimulai dari halaman pertama
        if (kunciTerakhir.current !== kunciFilter) {
            kunciTerakhir.current = kunciFilter;
            if (halaman !== 1) {
                setHalaman(1);
                return;
            }
        }

        const pengendali = new AbortController();
        setMemuat(true);
        setGalat(null);

        apiClient
            .get(url, {
                params: { ...Object.fromEntries(JSON.parse(kunciFilter)), page: halaman, per_halaman: perHalaman },
                signal: pengendali.signal,
            })
            .then((res) => {
                const metaBaru: MetaPaginasi = res.data.meta;
                // Baris terakhir di halaman ini baru saja hilang: mundur ke halaman yang masih ada
                if (metaBaru.total_data > 0 && halaman > metaBaru.total_halaman) {
                    setHalaman(metaBaru.total_halaman);
                    return;
                }
                setData(res.data.data || []);
                setMeta(metaBaru);
                setMemuat(false);
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                setGalat(ekstrakPesanError(err));
                setMemuat(false);
            });

        return () => pengendali.abort();
    }, [url, aktif, kunciFilter, halaman, perHalaman, percobaan]);

    const ubahPerHalaman = (nilai: number) => {
        setHalaman(1);
        setPerHalaman(nilai);
    };

    return {
        data,
        meta,
        memuat,
        galat,
        halaman,
        perHalaman,
        setHalaman,
        ubahPerHalaman,
        muatUlang: () => setPercobaan((n) => n + 1),
    };
}

type DaftarBerhalaman = Pick<
    ReturnType<typeof useDaftarBerhalaman>,
    'meta' | 'memuat' | 'halaman' | 'perHalaman' | 'setHalaman' | 'ubahPerHalaman'
>;

const ELIPSIS = 'elipsis';

function nomorHalaman(sekarang: number, total: number): (number | typeof ELIPSIS)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const hasil: (number | typeof ELIPSIS)[] = [1];
    const kiri = Math.max(2, sekarang - 1);
    const kanan = Math.min(total - 1, sekarang + 1);

    if (kiri > 2) hasil.push(ELIPSIS);
    for (let i = kiri; i <= kanan; i++) hasil.push(i);
    if (kanan < total - 1) hasil.push(ELIPSIS);
    hasil.push(total);

    return hasil;
}

function wadahGulir(elemen: HTMLElement | null): HTMLElement | null {
    let saatIni = elemen?.parentElement ?? null;
    while (saatIni) {
        const { overflowY } = getComputedStyle(saatIni);
        if ((overflowY === 'auto' || overflowY === 'scroll') && saatIni.scrollHeight > saatIni.clientHeight) {
            return saatIni;
        }
        saatIni = saatIni.parentElement;
    }
    return null;
}

const KELAS_TOMBOL =
    'relative isolate min-w-9 h-9 px-2 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#009f52] disabled:opacity-40';

export const Paginasi: React.FC<{
    daftar: DaftarBerhalaman;
    opsiPerHalaman?: number[];
    className?: string;
}> = ({ daftar, opsiPerHalaman = [10, 20, 50, 100], className }) => {
    const { meta, memuat, halaman, perHalaman, setHalaman, ubahPerHalaman } = daftar;
    const akarRef = useRef<HTMLElement>(null);
    const idPil = `halaman-aktif-${useId()}`;

    if (!meta || meta.total_data === 0) return null;

    const awal = (meta.halaman_sekarang - 1) * meta.per_halaman + 1;
    const akhir = Math.min(meta.halaman_sekarang * meta.per_halaman, meta.total_data);
    const pilihanUkuran = [...new Set([...opsiPerHalaman, perHalaman])].sort((a, b) => a - b);

    // Kembali ke atas daftar supaya halaman baru terbaca dari baris pertamanya
    const pindah = (tujuan: number) => {
        setHalaman(tujuan);
        const wadah = wadahGulir(akarRef.current);
        (wadah ?? window).scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <nav
            ref={akarRef}
            aria-label="Navigasi halaman"
            className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#5f756b]', className)}
        >
            <div className="flex items-center gap-3">
                <span className="tabular-nums">
                    <b className="font-semibold text-[#14221b]">
                        {awal.toLocaleString('id-ID')}–{akhir.toLocaleString('id-ID')}
                    </b>{' '}
                    dari {meta.total_data.toLocaleString('id-ID')}
                </span>
                <select
                    aria-label="Baris per halaman"
                    value={perHalaman}
                    onChange={(e) => ubahPerHalaman(Number(e.target.value))}
                    className="h-8 pl-2 pr-1 rounded-lg bg-[#f1f4f2] text-[#14221b] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#009f52]"
                >
                    {pilihanUkuran.map((ukuran) => (
                        <option key={ukuran} value={ukuran}>
                            {ukuran} / hal
                        </option>
                    ))}
                </select>
            </div>

            {meta.total_halaman > 1 && (
                <div className="flex items-center gap-0.5">
                    <motion.button
                        type="button"
                        aria-label="Halaman sebelumnya"
                        disabled={halaman <= 1 || memuat}
                        onClick={() => pindah(halaman - 1)}
                        whileTap={{ scale: 0.88 }}
                        className={cn(KELAS_TOMBOL, 'text-[#14221b] hover:bg-[#e6f8ef]')}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.button>

                    {nomorHalaman(halaman, meta.total_halaman).map((nomor, i) =>
                        nomor === ELIPSIS ? (
                            <span key={`elipsis-${i}`} aria-hidden className="w-7 text-center">
                                …
                            </span>
                        ) : (
                            <motion.button
                                key={nomor}
                                type="button"
                                aria-label={`Halaman ${nomor}`}
                                aria-current={nomor === halaman ? 'page' : undefined}
                                onClick={() => nomor !== halaman && pindah(nomor)}
                                whileTap={{ scale: 0.88 }}
                                className={cn(
                                    KELAS_TOMBOL,
                                    'tabular-nums',
                                    nomor === halaman ? 'text-white' : 'text-[#14221b] hover:bg-[#e6f8ef]'
                                )}
                            >
                                {nomor === halaman && (
                                    <motion.span
                                        layoutId={idPil}
                                        transition={PEGAS}
                                        className="absolute inset-0 -z-10 rounded-xl bg-[#009f52]"
                                    />
                                )}
                                {nomor}
                            </motion.button>
                        )
                    )}

                    <motion.button
                        type="button"
                        aria-label="Halaman berikutnya"
                        disabled={halaman >= meta.total_halaman || memuat}
                        onClick={() => pindah(halaman + 1)}
                        whileTap={{ scale: 0.88 }}
                        className={cn(KELAS_TOMBOL, 'text-[#14221b] hover:bg-[#e6f8ef]')}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            )}
        </nav>
    );
};
