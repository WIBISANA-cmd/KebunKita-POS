import React, { useState } from 'react';
import { NavbarAtas } from './NavbarAtas';
import { SidebarMobile } from './SidebarMobile';
import type { Pengguna, Cabang, ShiftKasir } from '@/tipe';

export interface KerangkaHalamanProps {
    children: React.ReactNode;
    halamanAktif: string;
    padaPilihHalaman: (halaman: string) => void;
    pengguna: Pengguna | null;
    cabangAktif: Cabang | null;
    shiftAktif: ShiftKasir | null;
    padaKeluar: () => void;
    /**
     * standar: navbar + konten berpadding sempit.
     * penuh: navbar + kanvas setinggi sisa layar, halaman mengatur padding sendiri (dipakai Kasir).
     * polos: tanpa navbar (dipakai halaman Masuk).
     */
    modeTampilan?: 'standar' | 'penuh' | 'polos';
}

export const KerangkaHalaman: React.FC<KerangkaHalamanProps> = ({
    children,
    halamanAktif,
    padaPilihHalaman,
    pengguna,
    cabangAktif,
    shiftAktif,
    padaKeluar,
    modeTampilan = 'standar',
}) => {
    const [drawerTerbuka, setDrawerTerbuka] = useState(false);

    return (
        <div className="min-h-screen bg-[#f6f9f7] text-[#14221b]">
            {modeTampilan === 'polos' ? (
                <main>{children}</main>
            ) : (
                <>
                    <NavbarAtas
                        halamanAktif={halamanAktif}
                        padaPilihHalaman={padaPilihHalaman}
                        pengguna={pengguna}
                        cabangAktif={cabangAktif}
                        padaBukaDrawer={() => setDrawerTerbuka(true)}
                        padaKeluar={padaKeluar}
                    />

                    <SidebarMobile
                        terbuka={drawerTerbuka}
                        padaTutup={() => setDrawerTerbuka(false)}
                        halamanAktif={halamanAktif}
                        padaPilihHalaman={padaPilihHalaman}
                        pengguna={pengguna}
                        cabangAktif={cabangAktif}
                        shiftAktif={shiftAktif}
                        padaKeluar={padaKeluar}
                    />

                    {modeTampilan === 'penuh' ? (
                        <main className="lg:h-[calc(100vh-4rem)]">{children}</main>
                    ) : (
                        <main className="p-3">{children}</main>
                    )}
                </>
            )}

        </div>
    );
};
