import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LogIn, LogOut, Store, X } from 'lucide-react';
import { daftarMenu, LogoKebunKita } from './navigasi';
import { PEGAS } from '@/komponen/ui/Animasi';
import { cn } from '@/util/kelas';
import type { Pengguna, Cabang, ShiftKasir } from '@/tipe';

export interface SidebarMobileProps {
    terbuka: boolean;
    padaTutup: () => void;
    halamanAktif: string;
    padaPilihHalaman: (halaman: string) => void;
    pengguna: Pengguna | null;
    cabangAktif: Cabang | null;
    shiftAktif: ShiftKasir | null;
    padaKeluar: () => void;
}

export const SidebarMobile: React.FC<SidebarMobileProps> = ({
    terbuka,
    padaTutup,
    halamanAktif,
    padaPilihHalaman,
    pengguna,
    cabangAktif,
    shiftAktif,
    padaKeluar,
}) => {
    useEffect(() => {
        const tanganiKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && terbuka) {
                padaTutup();
            }
        };
        window.addEventListener('keydown', tanganiKeydown);
        return () => window.removeEventListener('keydown', tanganiKeydown);
    }, [terbuka, padaTutup]);

    const navigasi = (id: string) => {
        padaPilihHalaman(id);
        padaTutup();
    };

    return (
        <AnimatePresence>
            {terbuka && (
        <motion.div className="fixed inset-0 z-50 lg:hidden flex" exit={{ pointerEvents: 'none' }}>
            <motion.div
                className="fixed inset-0 bg-[#14221b]/40 backdrop-blur-xs"
                onClick={padaTutup}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            />

            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                className="relative w-72 max-w-[82vw] bg-white h-full shadow-2xl z-10 flex flex-col"
            >
                <div className="h-16 px-5 flex items-center justify-between shrink-0">
                    <LogoKebunKita className="text-xl" padaKlik={() => navigasi('dashboard')} />
                    <button
                        onClick={padaTutup}
                        className="p-1.5 rounded-lg text-[#5f756b] hover:bg-[#f6f9f7] transition-colors"
                        aria-label="Tutup menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mx-4 mb-2 p-3 rounded-xl bg-[#f6f9f7] space-y-1.5 text-xs">
                    {cabangAktif && (
                        <div className="flex items-center gap-2 font-semibold text-[#14221b]">
                            <Store className="w-3.5 h-3.5 text-[#009f52]" />
                            <span className="truncate">{cabangAktif.nama}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 font-semibold">
                        <span className={`w-2 h-2 rounded-full ${shiftAktif ? 'bg-[#009f52]' : 'bg-amber-500'}`} />
                        <span className={shiftAktif ? 'text-[#007b40]' : 'text-amber-700'}>
                            {shiftAktif ? 'Shift kasir aktif' : 'Shift kasir tutup'}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto scroll-tipis pl-4 py-2 space-y-1">
                    {daftarMenu.map((m, i) => {
                        const aktif = halamanAktif === m.id;
                        const Ikon = m.ikon;
                        return (
                            <motion.button
                                key={m.id}
                                onClick={() => navigasi(m.id)}
                                initial={{ opacity: 0, x: -18 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ ...PEGAS, delay: 0.05 + i * 0.03 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    'relative w-full flex items-center gap-3.5 pl-4 pr-5 h-11 rounded-l-xl text-[15px] transition-colors text-left',
                                    aktif
                                        ? 'bg-[#e6f8ef] text-[#007b40] font-bold'
                                        : 'text-[#3d4f46] font-medium hover:bg-[#f6f9f7] hover:text-[#14221b]'
                                )}
                            >
                                <Ikon
                                    className={cn('w-5 h-5 shrink-0', aktif ? 'text-[#009f52]' : 'text-[#5f756b]')}
                                    strokeWidth={aktif ? 2.4 : 1.9}
                                />
                                <span>{m.label}</span>
                                {aktif && (
                                    <span className="absolute right-0 inset-y-0 w-1.5 rounded-l-full bg-[#009f52]" />
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                <div className="p-4 shrink-0 border-t border-[#edf2ef]">
                    {pengguna ? (
                        <button
                            onClick={() => {
                                padaKeluar();
                                padaTutup();
                            }}
                            className="w-full flex items-center gap-3.5 pl-4 h-11 rounded-xl text-[15px] font-medium text-[#3d4f46] hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="w-5 h-5" strokeWidth={1.9} />
                            <span>Keluar</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => navigasi('masuk')}
                            className="w-full flex items-center gap-3.5 pl-4 h-11 rounded-xl text-[15px] font-semibold text-[#007b40] bg-[#e6f8ef] hover:bg-[#d2f3e2] transition-colors"
                        >
                            <LogIn className="w-5 h-5" />
                            <span>Masuk</span>
                        </button>
                    )}
                </div>
            </motion.aside>
        </motion.div>
            )}
        </AnimatePresence>
    );
};
