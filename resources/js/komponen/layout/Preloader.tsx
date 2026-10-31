import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LogoBulat } from './navigasi';
import { KURVA_HALUS, PEGAS_LEMBUT } from '@/komponen/ui/Animasi';

const DURASI_MINIMAL_MS = 1500;
const BENTUK_KLIP_PENUH = 'circle(150% at 50% 24%)';
const BENTUK_KLIP_HABIS = 'circle(0% at 50% 24%)';

export const Preloader: React.FC<{ sesiSiap: boolean; padaSelesai: () => void }> = ({ sesiSiap, padaSelesai }) => {
    const kurangiGerak = useReducedMotion();
    const [waktuMinimalLewat, setWaktuMinimalLewat] = useState(false);

    useEffect(() => {
        const penunda = setTimeout(() => setWaktuMinimalLewat(true), kurangiGerak ? 200 : DURASI_MINIMAL_MS);
        return () => clearTimeout(penunda);
    }, [kurangiGerak]);

    useEffect(() => {
        if (sesiSiap && waktuMinimalLewat) padaSelesai();
    }, [sesiSiap, waktuMinimalLewat, padaSelesai]);

    const muncul = (jeda: number) => ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: jeda, ease: KURVA_HALUS },
    });

    return (
        <motion.div
            role="status"
            aria-label="Memuat aplikasi"
            initial={{ clipPath: BENTUK_KLIP_PENUH }}
            animate={{ clipPath: BENTUK_KLIP_PENUH }}
            exit={{ clipPath: BENTUK_KLIP_HABIS }}
            transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 z-[80] overflow-hidden flex flex-col items-center px-8 pt-[14dvh] text-white font-[Raleway] bg-[linear-gradient(180deg,#0f7a4c_0%,#14906c_42%,#0e6b3e_100%)]"
        >
            <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 15 }}
                className="relative"
            >
                <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border-2 border-white/50"
                    animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
                />
                <LogoBulat className="w-[88px] h-[88px]" />
            </motion.div>

            <motion.div {...muncul(0.15)} className="mt-3 text-2xl font-semibold">
                kebunkita
            </motion.div>

            <div className="mt-[9dvh] text-center">
                <motion.h1 {...muncul(0.28)} className="text-[34px] leading-tight font-semibold">
                    Selamat Datang!
                </motion.h1>
                <motion.p {...muncul(0.38)} className="mt-3 text-[15px] leading-snug text-white/90">
                    Tetap terhubung dengan toko Anda,
                    <br />
                    kami sedang menyiapkan semuanya
                </motion.p>
            </div>

            <motion.div
                {...muncul(0.5)}
                className="relative mt-[9dvh] w-full max-w-[300px] h-12 rounded-full border border-white/90 overflow-hidden flex items-center justify-center"
            >
                <motion.span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-white/25"
                    initial={{ width: '0%' }}
                    animate={{ width: sesiSiap && waktuMinimalLewat ? '100%' : '86%' }}
                    transition={sesiSiap && waktuMinimalLewat ? PEGAS_LEMBUT : { duration: 1.5, ease: KURVA_HALUS }}
                />
                <span className="relative text-sm font-semibold tracking-wider">MEMUAT</span>
            </motion.div>

            <motion.div {...muncul(0.6)} className="mt-[4.5dvh] text-xs">
                KASIR <b>CEPAT</b>
                <span className="mx-3">|</span>
                STOK <b>FEFO</b>
            </motion.div>
        </motion.div>
    );
};
