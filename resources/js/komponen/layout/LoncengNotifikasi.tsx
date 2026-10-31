import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { ArrowRight, Bell, Receipt, ShoppingBag } from 'lucide-react';
import { KURVA_HALUS, PEGAS } from '@/komponen/ui/Animasi';
import { Skeleton } from '@/komponen/ui/Skeleton';
import { apiClient, ekstrakPesanError } from '@/layanan/apiClient';
import { langgananTransaksiCabang, type StatusRealtime } from '@/layanan/realtime';
import { formatRupiah } from '@/util/formatRupiah';
import { cn } from '@/util/kelas';
import type { TransaksiNotifikasi } from '@/tipe';

const BATAS_TRANSAKSI = 8;
const JEDA_POLLING_MS = 15000;

function kunciDilihat(penggunaId: string): string {
    return `kebunkita:notifikasi-dilihat:${penggunaId}`;
}

function bacaWaktuDilihat(penggunaId: string): string | null {
    try {
        return localStorage.getItem(kunciDilihat(penggunaId));
    } catch {
        return null;
    }
}

function simpanWaktuDilihat(penggunaId: string, waktu: string): void {
    try {
        localStorage.setItem(kunciDilihat(penggunaId), waktu);
    } catch {
        // Tanpa penyimpanan lokal, hitungan belum dilihat hanya berlaku di tab ini
    }
}

function waktuRelatif(iso: string): string {
    const selisihDetik = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (selisihDetik < 45) return 'baru saja';

    const format = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    if (selisihDetik < 3600) return format.format(-Math.round(selisihDetik / 60), 'minute');
    if (selisihDetik < 86400) return format.format(-Math.round(selisihDetik / 3600), 'hour');
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export const LoncengNotifikasi: React.FC<{
    cabangId: string;
    penggunaId: string;
    padaPilihHalaman: (halaman: string) => void;
}> = ({ cabangId, penggunaId, padaPilihHalaman }) => {
    const [terbuka, setTerbuka] = useState(false);
    const [daftar, setDaftar] = useState<TransaksiNotifikasi[]>([]);
    const [belumDilihat, setBelumDilihat] = useState(0);
    const [idBaru, setIdBaru] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<StatusRealtime>('menyambung');
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState<string | null>(null);
    const [, setDetak] = useState(0);

    const akarRef = useRef<HTMLDivElement>(null);
    const terbukaRef = useRef(false);
    terbukaRef.current = terbuka;
    const kontrolLonceng = useAnimationControls();

    const goyangkanLonceng = useCallback(() => {
        kontrolLonceng.start({ rotate: [0, 18, -16, 11, -7, 3, 0], transition: { duration: 0.8 } });
    }, [kontrolLonceng]);

    const muat = useCallback(async () => {
        try {
            const sejak = bacaWaktuDilihat(penggunaId);
            const res = await apiClient.get('/notifikasi/transaksi', {
                params: { batas: BATAS_TRANSAKSI, sejak: sejak ?? undefined },
            });

            const transaksi: TransaksiNotifikasi[] = res.data.data.transaksi;
            setDaftar(transaksi);
            setGalat(null);

            if (sejak === null) {
                // Pemakaian pertama: riwayat lama tidak dihitung sebagai notifikasi baru
                simpanWaktuDilihat(penggunaId, new Date().toISOString());
            } else if (!terbukaRef.current) {
                setBelumDilihat(res.data.data.belum_dilihat);
            }
        } catch (err) {
            setGalat(ekstrakPesanError(err));
        } finally {
            setMemuat(false);
        }
    }, [penggunaId]);

    useEffect(() => {
        muat();
    }, [muat]);

    useEffect(() => {
        return langgananTransaksiCabang<TransaksiNotifikasi>(
            cabangId,
            (transaksi) => {
                setDaftar((prev) =>
                    [transaksi, ...prev.filter((t) => t.id !== transaksi.id)].slice(0, BATAS_TRANSAKSI)
                );
                setIdBaru((prev) => new Set(prev).add(transaksi.id));
                goyangkanLonceng();

                if (terbukaRef.current) {
                    simpanWaktuDilihat(penggunaId, new Date().toISOString());
                } else {
                    setBelumDilihat((n) => n + 1);
                }
            },
            setStatus
        );
    }, [cabangId, penggunaId, goyangkanLonceng]);

    // Selama WebSocket tidak tersambung, data tetap diperbarui berkala.
    // Saat tersambung kembali, muat sekali untuk mengejar transaksi yang terlewat.
    useEffect(() => {
        if (status === 'terhubung') {
            muat();
            return;
        }
        if (status !== 'terputus') return;

        const penghitung = setInterval(() => {
            if (!document.hidden) muat();
        }, JEDA_POLLING_MS);
        return () => clearInterval(penghitung);
    }, [status, muat]);

    useEffect(() => {
        if (!terbuka) return;

        const tutupBilaDiLuar = (e: PointerEvent) => {
            if (!akarRef.current?.contains(e.target as Node)) setTerbuka(false);
        };
        const tutupDenganEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setTerbuka(false);
        };
        const penyegarWaktu = setInterval(() => setDetak((n) => n + 1), 30000);

        document.addEventListener('pointerdown', tutupBilaDiLuar);
        document.addEventListener('keydown', tutupDenganEscape);
        return () => {
            document.removeEventListener('pointerdown', tutupBilaDiLuar);
            document.removeEventListener('keydown', tutupDenganEscape);
            clearInterval(penyegarWaktu);
        };
    }, [terbuka]);

    const alihkanPanel = () => {
        const akanTerbuka = !terbuka;
        setTerbuka(akanTerbuka);

        if (akanTerbuka) {
            setBelumDilihat(0);
            simpanWaktuDilihat(penggunaId, new Date().toISOString());
        } else {
            setIdBaru(new Set());
        }
    };

    const realtimeAktif = status === 'terhubung';

    return (
        <div ref={akarRef} className="relative">
            <motion.button
                type="button"
                onClick={alihkanPanel}
                initial="diam"
                whileHover="sorot"
                whileTap={{ scale: 0.9 }}
                aria-haspopup="true"
                aria-expanded={terbuka}
                aria-label={belumDilihat > 0 ? `Notifikasi, ${belumDilihat} transaksi baru` : 'Notifikasi transaksi'}
                className={cn(
                    'relative p-2 rounded-full text-[#14221b] transition-colors',
                    terbuka ? 'bg-[#e6f8ef] text-[#007b40]' : 'hover:bg-[#f6f9f7]'
                )}
            >
                <motion.span
                    className="block origin-top"
                    animate={kontrolLonceng}
                    variants={{
                        diam: { rotate: 0 },
                        sorot: { rotate: [0, 16, -14, 9, -5, 0], transition: { duration: 0.7 } },
                    }}
                >
                    <Bell className="w-5 h-5" strokeWidth={1.9} />
                </motion.span>

                <AnimatePresence>
                    {belumDilihat > 0 && (
                        <motion.span
                            key={belumDilihat}
                            initial={{ scale: 0.3 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e5121b] text-white text-[10px] font-bold ring-2 ring-white flex items-center justify-center tabular-nums"
                        >
                            {belumDilihat > 9 ? '9+' : belumDilihat}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {terbuka && (
                    <motion.div
                        role="dialog"
                        aria-label="Riwayat transaksi terakhir"
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.13 } }}
                        transition={PEGAS}
                        className="absolute right-0 top-full mt-2 w-[380px] origin-top-right z-50 max-sm:fixed max-sm:inset-x-3 max-sm:top-[68px] max-sm:mt-0 max-sm:w-auto bg-white rounded-3xl border border-[#edf2ef] shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                            <div>
                                <h2 className="text-base font-extrabold text-[#14221b]">Transaksi Terakhir</h2>
                                <p className="text-xs text-[#5f756b]">{BATAS_TRANSAKSI} penjualan terbaru cabang ini</p>
                            </div>
                            <span
                                title={realtimeAktif ? 'Tersambung lewat WebSocket' : 'WebSocket terputus, diperbarui tiap 15 detik'}
                                className={cn(
                                    'shrink-0 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-semibold',
                                    realtimeAktif ? 'bg-[#e6f8ef] text-[#007b40]' : 'bg-[#f1f4f2] text-[#3d4f46]'
                                )}
                            >
                                <span className="relative flex w-2 h-2">
                                    {realtimeAktif && <span className="absolute inset-0 rounded-full bg-[#009f52] animate-ping" />}
                                    <span className={cn('relative w-2 h-2 rounded-full', realtimeAktif ? 'bg-[#009f52]' : 'bg-[#8f9a95]')} />
                                </span>
                                {realtimeAktif ? 'Realtime' : 'Berkala'}
                            </span>
                        </div>

                        <div className="max-h-[min(420px,calc(100dvh-220px))] overflow-y-auto scroll-tipis border-t border-[#eef3f0]">
                            {memuat && daftar.length === 0 ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 rounded-2xl" />
                                    ))}
                                </div>
                            ) : galat && daftar.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-[#5f756b]">
                                    <p>{galat}</p>
                                    <button type="button" onClick={muat} className="mt-2 font-semibold text-[#007b40] hover:underline">
                                        Coba lagi
                                    </button>
                                </div>
                            ) : daftar.length === 0 ? (
                                <div className="px-6 py-10 text-center">
                                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#f1f8f4] flex items-center justify-center animate-mengambang">
                                        <Receipt className="w-5 h-5 text-[#9fb5aa]" />
                                    </div>
                                    <p className="text-sm font-semibold text-[#3d4f46]">Belum ada transaksi</p>
                                    <p className="text-xs text-[#5f756b] mt-0.5">Penjualan baru akan muncul di sini.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-[#eef3f0]">
                                    <AnimatePresence initial={false}>
                                        {daftar.map((transaksi) => {
                                            const baru = idBaru.has(transaksi.id);
                                            return (
                                                <motion.li
                                                    key={transaksi.id}
                                                    layout="position"
                                                    initial={{ opacity: 0, x: 28 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3, ease: KURVA_HALUS }}
                                                    className={cn(
                                                        'flex items-start gap-3 px-5 py-3 transition-colors duration-500',
                                                        baru ? 'bg-[#eefaf3]' : 'hover:bg-[#f9fbfa]'
                                                    )}
                                                >
                                                    <span className="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-[#e6f8ef] text-[#009f52] flex items-center justify-center">
                                                        <ShoppingBag className="w-4 h-4" />
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline justify-between gap-2">
                                                            <span className="text-[13px] font-bold text-[#14221b] truncate">{transaksi.nomor}</span>
                                                            <span className="text-[11px] text-[#5f756b] shrink-0">
                                                                {waktuRelatif(transaksi.waktu_penjualan)}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-[#5f756b] truncate">
                                                            {transaksi.pelanggan ?? 'Pelanggan umum'} · {transaksi.jumlah_item} produk
                                                            {transaksi.kasir ? ` · ${transaksi.kasir}` : ''}
                                                        </div>
                                                        <div className="mt-0.5 flex items-baseline justify-between gap-2">
                                                            <span className="text-sm font-extrabold text-[#009f52] tabular-nums">
                                                                {formatRupiah(transaksi.total_rp)}
                                                            </span>
                                                            {transaksi.metode_bayar && (
                                                                <span className="text-[11px] text-[#5f756b] truncate">{transaksi.metode_bayar}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.li>
                                            );
                                        })}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setTerbuka(false);
                                setIdBaru(new Set());
                                padaPilihHalaman('laporan');
                            }}
                            className="group w-full h-12 flex items-center justify-center gap-1.5 border-t border-[#eef3f0] text-sm font-bold text-[#007b40] hover:bg-[#e6f8ef] transition-colors"
                        >
                            Lihat Riwayat Transaksi Lengkap
                            <ArrowRight className="w-4 h-4 transition-[translate] duration-200 group-hover:translate-x-1" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
