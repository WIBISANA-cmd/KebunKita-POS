import React from 'react';
import { motion } from 'motion/react';
import { LogOut, Menu, Store, UserCheck } from 'lucide-react';
import { daftarMenu, LogoKebunKita } from './navigasi';
import { LoncengNotifikasi } from './LoncengNotifikasi';
import { PEGAS } from '@/komponen/ui/Animasi';
import { cn } from '@/util/kelas';
import type { Pengguna, Cabang } from '@/tipe';

export interface NavbarAtasProps {
    halamanAktif: string;
    padaPilihHalaman: (halaman: string) => void;
    pengguna: Pengguna | null;
    cabangAktif: Cabang | null;
    padaBukaDrawer: () => void;
    padaKeluar: () => void;
}

export const NavbarAtas: React.FC<NavbarAtasProps> = ({
    halamanAktif,
    padaPilihHalaman,
    pengguna,
    cabangAktif,
    padaBukaDrawer,
    padaKeluar,
}) => {
    return (
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#edf2ef]">
            <div className="h-full px-3 sm:px-4 flex items-center gap-3 xl:gap-6">
                <button
                    onClick={padaBukaDrawer}
                    className="lg:hidden p-2 -ml-1 rounded-xl text-[#14221b] hover:bg-[#e6f8ef] transition-colors"
                    aria-label="Buka menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <LogoKebunKita className="text-xl" padaKlik={() => padaPilihHalaman('dashboard')} />

                {/* Menu desktop */}
                <nav className="hidden lg:flex flex-1 min-w-0 h-full items-stretch overflow-x-auto no-scrollbar">
                    {daftarMenu.map((m) => {
                        const aktif = halamanAktif === m.id;
                        const Ikon = m.ikon;
                        return (
                            <button
                                key={m.id}
                                onClick={() => padaPilihHalaman(m.id)}
                                className="relative shrink-0 h-full px-0.5 flex items-center"
                            >
                                <span
                                    className={cn(
                                        'relative isolate flex items-center gap-2 px-2 xl:px-3 h-9 rounded-lg text-[13px] xl:text-sm transition-colors',
                                        aktif
                                            ? 'text-[#007b40] font-bold'
                                            : 'text-[#3d4f46] font-medium hover:bg-[#f6f9f7] hover:text-[#14221b]'
                                    )}
                                >
                                    {aktif && (
                                        <motion.span
                                            layoutId="latar-menu-aktif"
                                            transition={PEGAS}
                                            className="absolute inset-0 -z-10 rounded-lg bg-[#e6f8ef]"
                                        />
                                    )}
                                    <Ikon
                                        className={cn('hidden 2xl:block w-4 h-4', aktif ? 'text-[#009f52]' : 'text-[#5f756b]')}
                                        strokeWidth={aktif ? 2.4 : 1.9}
                                    />
                                    {m.label}
                                </span>
                                {aktif && (
                                    <motion.span
                                        layoutId="garis-menu-aktif"
                                        transition={PEGAS}
                                        className="absolute bottom-0 inset-x-2 h-[3px] rounded-t-full bg-[#009f52]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="flex-1 lg:hidden" />

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {cabangAktif && (
                        <div className="hidden 2xl:flex items-center gap-1.5 px-3 h-9 rounded-full bg-[#f6f9f7] text-xs font-semibold text-[#14221b]">
                            <Store className="w-3.5 h-3.5 text-[#009f52]" />
                            <span className="truncate max-w-[140px]">{cabangAktif.nama}</span>
                        </div>
                    )}

                    {pengguna && (cabangAktif?.id ?? pengguna.cabang_id) && (
                        <LoncengNotifikasi
                            cabangId={cabangAktif?.id ?? (pengguna.cabang_id as string)}
                            penggunaId={pengguna.id}
                            padaPilihHalaman={padaPilihHalaman}
                        />
                    )}

                    {pengguna ? (
                        <>
                            <div className="flex items-center gap-2.5">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    transition={PEGAS}
                                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e6f8ef] to-[#c3eed7] flex items-center justify-center text-[#007b40] text-sm font-extrabold"
                                >
                                    {pengguna.nama.charAt(0).toUpperCase()}
                                </motion.div>
                                <div className="hidden xl:flex flex-col leading-tight">
                                    <span className="text-sm font-bold text-[#14221b] max-w-[140px] truncate">{pengguna.nama}</span>
                                    <span className="text-[11px] text-[#5f756b]">
                                        {pengguna.peran?.[0]?.nama || 'Pengguna'}
                                    </span>
                                </div>
                            </div>
                            <motion.button
                                onClick={padaKeluar}
                                title="Keluar"
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.9 }}
                                transition={PEGAS}
                                className="hidden lg:flex p-2 rounded-full text-[#5f756b] hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-[18px] h-[18px]" />
                            </motion.button>
                        </>
                    ) : (
                        <button
                            onClick={() => padaPilihHalaman('masuk')}
                            className="flex items-center gap-1.5 px-4 h-9 bg-[#009f52] hover:bg-[#007b40] text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <UserCheck className="w-4 h-4" />
                            <span>Masuk</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
