import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    type AnimationPlaybackControls,
} from 'motion/react';
import { X } from 'lucide-react';
import { Tombol } from './Tombol';
import { KURVA_HALUS, PEGAS } from './Animasi';

export type TipePopup = 'sukses' | 'error' | 'peringatan' | 'info';

export interface OpsiPopup {
    tipe: TipePopup;
    judul: string;
    /** Label kecil di atas judul; bawaan mengikuti tipe. */
    label?: string;
    rincian?: string;
    /** Milidetik sampai tertutup sendiri; null berarti menunggu ditutup pengguna. */
    durasiMs?: number | null;
    aksi?: { label: string; jalankan: () => void };
}

export interface OpsiKonfirmasi {
    judul: string;
    label?: string;
    rincian?: string;
    labelSetuju?: string;
    labelBatal?: string;
    bahaya?: boolean;
}

interface ItemPopup extends Omit<OpsiPopup, 'tipe'> {
    id: number;
    tipe: TipePopup | 'konfirmasi';
    labelSetuju?: string;
    labelBatal?: string;
    bahaya?: boolean;
    selesai?: (setuju: boolean) => void;
}

const TEMA = {
    sukses: { label: 'Berhasil', warna: '#5fdc96', cincin: '95, 220, 150', ikon: 'M14 27l9 9 16-18' },
    error: { label: 'Gagal', warna: '#f2706b', cincin: '242, 112, 107', ikon: 'M16 16l20 20M36 16L16 36' },
    peringatan: { label: 'Perhatian', warna: '#ffa94d', cincin: '255, 169, 77', ikon: 'M26 12v17M26 38.5v.5' },
    info: { label: 'Informasi', warna: '#3fbfc4', cincin: '63, 191, 196', ikon: 'M26 13v.5M26 23v16' },
    konfirmasi: {
        label: 'Konfirmasi',
        warna: '#ffa94d',
        cincin: '255, 169, 77',
        ikon: 'M18 19a8 8 0 1 1 12.5 6.6c-3 2-4.5 3.4-4.5 6.4M26 39.5v.5',
    },
} as const;

const DURASI_BAWAAN: Record<TipePopup, number | null> = {
    sukses: 3200,
    info: 4500,
    peringatan: null,
    error: null,
};

// Posisi tetap supaya pola serpihan sama di setiap popup.
const SERPIHAN = Array.from({ length: 14 }, (_, i) => {
    const sudut = (i / 14) * Math.PI * 2 + (i % 3) * 0.22;
    const jarak = 78 + (i % 4) * 24;
    return {
        x: Math.cos(sudut) * jarak,
        // Dibatasi ke bawah agar tidak menimpa teks kartu
        y: Math.min(Math.sin(sudut) * jarak * 0.82, 62),
        ukuran: 6 + (i % 3) * 2,
        bulat: i % 3 === 0,
        putar: 40 + i * 37,
    };
});

const KartuPopup: React.FC<{
    item: ItemPopup;
    sisaAntrean: number;
    padaTutup: (setuju: boolean) => void;
}> = ({ item, sisaAntrean, padaTutup }) => {
    const kurangiGerak = useReducedMotion();
    const tema = TEMA[item.tipe];
    const adalahKonfirmasi = item.tipe === 'konfirmasi';
    const durasi = item.tipe === 'konfirmasi' ? null : item.durasiMs === undefined ? DURASI_BAWAAN[item.tipe] : item.durasiMs;

    const kemajuan = useMotionValue(1);
    const kontrolRef = useRef<AnimationPlaybackControls | null>(null);
    const tombolFokusRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        tombolFokusRef.current?.focus();
        if (!durasi) return;

        const kontrol = animate(kemajuan, 0, {
            duration: durasi / 1000,
            ease: 'linear',
            onComplete: () => padaTutup(false),
        });
        kontrolRef.current = kontrol;
        return () => kontrol.stop();
        // padaTutup berubah tiap render antrean; hitung mundur hanya dimulai sekali per popup
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [durasi, kemajuan]);

    const judulPopup = item.label ?? tema.label;
    const warnaCincin = (alpha: number) => `rgba(${tema.cincin}, ${alpha})`;

    return (
        <motion.div
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 overflow-y-auto"
            role="alertdialog"
            aria-modal="true"
            aria-label={`${judulPopup}: ${item.judul}`}
            exit={{ pointerEvents: 'none' }}
        >
            <motion.div
                className="fixed inset-0 bg-[#1c2421]/60 cursor-pointer"
                onClick={() => padaTutup(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            />

            <motion.div
                onPointerEnter={() => kontrolRef.current?.pause()}
                onPointerLeave={() => kontrolRef.current?.play()}
                initial={{ opacity: 0, y: 60, scale: 0.82 }}
                animate={
                    item.tipe === 'error' && !kurangiGerak
                        ? { opacity: 1, y: 0, scale: 1, x: [0, 0, -9, 9, -6, 6, 0] }
                        : { opacity: 1, y: 0, scale: 1 }
                }
                exit={{ opacity: 0, y: 24, scale: 0.92, transition: { duration: 0.16 } }}
                transition={{
                    type: 'spring',
                    stiffness: 340,
                    damping: 24,
                    x: { duration: 0.75, times: [0, 0.4, 0.5, 0.62, 0.74, 0.86, 1] },
                }}
                className="relative z-10 w-full max-w-[340px] mt-12 bg-white rounded-[28px] shadow-2xl pt-[108px] px-7 pb-7 text-center"
            >
                {/* Lingkaran ikon, cincin, dan serpihan berpusat di tepi atas kartu */}
                <div aria-hidden className="absolute left-1/2 top-3.5 w-0 h-0 pointer-events-none">
                    {[320, 236, 160].map((ukuran, i) => (
                        <motion.span
                            key={ukuran}
                            className="absolute rounded-full"
                            style={{
                                width: ukuran,
                                height: ukuran,
                                left: -ukuran / 2,
                                top: -ukuran / 2,
                                backgroundColor: warnaCincin(0.09 + i * 0.03),
                            }}
                            initial={{ scale: 0.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ ...PEGAS, delay: 0.1 + (2 - i) * 0.07 }}
                        />
                    ))}

                    {item.tipe !== 'error' &&
                        SERPIHAN.map((s, i) => (
                            <motion.span
                                key={i}
                                className={`absolute border ${s.bulat ? 'rounded-full' : 'rounded-[2px]'}`}
                                style={{
                                    width: s.ukuran,
                                    height: s.ukuran,
                                    left: -s.ukuran / 2,
                                    top: -s.ukuran / 2,
                                    borderColor: warnaCincin(0.65),
                                    backgroundColor: warnaCincin(0.14),
                                }}
                                initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
                                animate={{ x: s.x, y: s.y, scale: 1, opacity: 1, rotate: s.putar }}
                                transition={{ duration: 0.7, delay: 0.24 + i * 0.012, ease: KURVA_HALUS }}
                            />
                        ))}

                    <motion.div
                        className="absolute -left-14 -top-14 w-28 h-28 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tema.warna, boxShadow: `0 14px 30px ${warnaCincin(0.45)}` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 15, delay: 0.06 }}
                    >
                        <svg viewBox="0 0 52 52" className="w-[68px] h-[68px]" fill="none">
                            <motion.path
                                d={tema.ikon}
                                stroke="#ffffff"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: kurangiGerak ? 1 : 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.42, delay: 0.3, ease: KURVA_HALUS }}
                            />
                        </svg>
                    </motion.div>
                </div>

                <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.26, ease: KURVA_HALUS }}
                >
                    <p className="text-[15px] tracking-wide text-[#8f9a95]">{judulPopup}</p>
                    <h2 className="mt-1.5 text-[21px] leading-snug font-bold tracking-wide text-[#23302a] break-words">
                        {item.judul}
                    </h2>
                    {item.rincian && (
                        <p className="mt-2 text-sm leading-relaxed text-[#5f756b] break-words">{item.rincian}</p>
                    )}

                    {adalahKonfirmasi ? (
                        <div className="mt-6 grid grid-cols-2 gap-2.5">
                            <Tombol varian="secondary" onClick={() => padaTutup(false)}>
                                {item.labelBatal ?? 'Batal'}
                            </Tombol>
                            <Tombol
                                ref={tombolFokusRef}
                                varian={item.bahaya ? 'danger' : 'primary'}
                                onClick={() => padaTutup(true)}
                            >
                                {item.labelSetuju ?? 'Ya, Lanjutkan'}
                            </Tombol>
                        </div>
                    ) : (
                        item.aksi && (
                            <Tombol
                                ref={tombolFokusRef}
                                className="mt-5 w-full"
                                onClick={() => {
                                    item.aksi?.jalankan();
                                    padaTutup(true);
                                }}
                            >
                                {item.aksi.label}
                            </Tombol>
                        )
                    )}
                </motion.div>

                {durasi && (
                    <div className="absolute inset-x-7 bottom-3 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: warnaCincin(0.16) }}>
                        <motion.span
                            className="block h-full origin-left rounded-full"
                            style={{ scaleX: kemajuan, backgroundColor: tema.warna }}
                        />
                    </div>
                )}
            </motion.div>

            <div className="relative z-10 mt-7 flex flex-col items-center gap-2">
                <motion.button
                    ref={item.aksi || adalahKonfirmasi ? undefined : tombolFokusRef}
                    type="button"
                    aria-label="Tutup"
                    onClick={() => padaTutup(false)}
                    initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileHover={{ rotate: 90, scale: 1.12 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ ...PEGAS, delay: 0 }}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <X className="w-8 h-8" strokeWidth={1.4} />
                </motion.button>
                {sisaAntrean > 0 && (
                    <span className="text-xs font-medium text-white/80">{sisaAntrean} pesan lagi</span>
                )}
            </div>
        </motion.div>
    );
};

interface NilaiPopup {
    tampilkan: (opsi: OpsiPopup) => void;
    konfirmasi: (opsi: OpsiKonfirmasi) => Promise<boolean>;
}

const KonteksPopup = createContext<NilaiPopup | null>(null);

export const usePopup = (): NilaiPopup => {
    const nilai = useContext(KonteksPopup);
    if (!nilai) throw new Error('usePopup harus dipakai di dalam PenyediaPopup');
    return nilai;
};

export const PenyediaPopup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [antrean, setAntrean] = useState<ItemPopup[]>([]);
    const idBerikutnya = useRef(1);
    const fokusSebelumnya = useRef<HTMLElement | null>(null);
    const aktif = antrean[0];

    const tambah = useCallback((item: Omit<ItemPopup, 'id'>) => {
        setAntrean((prev) => {
            // Beberapa permintaan yang gagal bersamaan cukup diberitahukan sekali
            if (prev.some((p) => p.tipe === item.tipe && p.judul === item.judul)) return prev;
            if (prev.length === 0 && document.activeElement instanceof HTMLElement) {
                fokusSebelumnya.current = document.activeElement;
            }
            return [...prev, { ...item, id: idBerikutnya.current++ }];
        });
    }, []);

    const tampilkan = useCallback((opsi: OpsiPopup) => tambah(opsi), [tambah]);

    const konfirmasi = useCallback(
        (opsi: OpsiKonfirmasi) =>
            new Promise<boolean>((selesai) => tambah({ ...opsi, tipe: 'konfirmasi', selesai })),
        [tambah]
    );

    const tutup = useCallback((setuju: boolean) => {
        setAntrean((prev) => {
            prev[0]?.selesai?.(setuju);
            const sisa = prev.slice(1);
            if (sisa.length === 0) fokusSebelumnya.current?.focus();
            return sisa;
        });
    }, []);

    // Fase capture: Escape menutup popup saja, bukan dialog di bawahnya
    useEffect(() => {
        if (!aktif) return;
        const tanganiKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                tutup(false);
            }
        };
        window.addEventListener('keydown', tanganiKeydown, true);
        return () => window.removeEventListener('keydown', tanganiKeydown, true);
    }, [aktif, tutup]);

    const nilai = useMemo(() => ({ tampilkan, konfirmasi }), [tampilkan, konfirmasi]);

    return (
        <KonteksPopup.Provider value={nilai}>
            {children}
            {createPortal(
                <AnimatePresence mode="wait">
                    {aktif && (
                        <KartuPopup
                            key={aktif.id}
                            item={aktif}
                            sisaAntrean={antrean.length - 1}
                            padaTutup={tutup}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </KonteksPopup.Provider>
    );
};
