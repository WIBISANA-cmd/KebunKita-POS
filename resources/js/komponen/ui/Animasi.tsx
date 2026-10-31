import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, useReducedMotion, type Transition, type Variants } from 'motion/react';

export const PEGAS: Transition = { type: 'spring', stiffness: 420, damping: 32 };
export const PEGAS_LEMBUT: Transition = { type: 'spring', stiffness: 220, damping: 26 };
export const KURVA_HALUS = [0.22, 1, 0.36, 1] as const;

// Halaman mengendalikan urutan: setiap Kartu di dalamnya muncul bergantian lewat varian yang diwariskan.
export const varianHalaman: Variants = {
    awal: { opacity: 0 },
    tampil: {
        opacity: 1,
        transition: { duration: 0.18, staggerChildren: 0.055 },
    },
    keluar: { opacity: 0, transition: { duration: 0.12 } },
};

// `custom` memberi jeda tambahan untuk kartu yang baru tampil setelah data selesai dimuat.
export const varianMuncul: Variants = {
    awal: { opacity: 0, y: 18 },
    tampil: (urutan: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { ...PEGAS_LEMBUT, delay: urutan * 0.07 },
    }),
};

export interface AngkaBerjalanProps {
    nilai: number;
    format: (nilai: number) => string;
    durasi?: number;
    className?: string;
}

// Teks diperbarui langsung ke DOM agar hitungan tidak memicu render React di setiap frame.
export const AngkaBerjalan: React.FC<AngkaBerjalanProps> = ({ nilai, format, durasi = 0.9, className }) => {
    const elemenRef = useRef<HTMLSpanElement>(null);
    const nilaiTerakhir = useRef(0);
    const formatRef = useRef(format);
    const kurangiGerak = useReducedMotion();

    formatRef.current = format;

    useLayoutEffect(() => {
        if (elemenRef.current) {
            elemenRef.current.textContent = formatRef.current(nilaiTerakhir.current);
        }
    }, []);

    useEffect(() => {
        const elemen = elemenRef.current;
        if (!elemen) return;

        const dari = nilaiTerakhir.current;
        nilaiTerakhir.current = nilai;

        if (kurangiGerak || dari === nilai) {
            elemen.textContent = formatRef.current(nilai);
            return;
        }

        const kontrol = animate(dari, nilai, {
            duration: durasi,
            ease: KURVA_HALUS,
            onUpdate: (v) => {
                elemen.textContent = formatRef.current(v);
            },
        });

        return () => kontrol.stop();
    }, [nilai, durasi, kurangiGerak]);

    return <span ref={elemenRef} className={className} />;
};
