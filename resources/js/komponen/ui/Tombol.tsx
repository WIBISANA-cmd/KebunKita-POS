import React, { useState } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { SpinnerTombol } from './SpinnerTombol';
import { PEGAS } from './Animasi';
import { cn } from '@/util/kelas';

export interface TombolProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children?: React.ReactNode;
    varian?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'mint' | 'oranye';
    ukuran?: 'sm' | 'md' | 'lg';
    memuat?: boolean;
    ikon?: React.ReactNode;
}

interface Riak {
    id: number;
    x: number;
    y: number;
    ukuran: number;
}

export const Tombol = React.forwardRef<HTMLButtonElement, TombolProps>(({
    children,
    type = 'button',
    varian = 'primary',
    ukuran = 'md',
    memuat = false,
    ikon,
    disabled,
    className,
    onPointerDown,
    ...props
}, ref) => {
    const [daftarRiak, setDaftarRiak] = useState<Riak[]>([]);
    const nonaktif = disabled || memuat;

    const basis = 'relative overflow-hidden inline-flex items-center justify-center font-semibold rounded-xl transition-[background-color,box-shadow,opacity] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed';

    const varianClass = {
        primary: 'bg-[#009f52] hover:bg-[#007b40] text-white focus-visible:ring-[#009f52] shadow-md shadow-[#009f52]/20 hover:shadow-lg hover:shadow-[#009f52]/30',
        secondary: 'bg-white hover:bg-[#f6f9f7] text-[#14221b] border border-[#e3ece7] focus-visible:ring-[#009f52]',
        mint: 'bg-[#e6f8ef] hover:bg-[#d2f3e2] text-[#14221b] focus-visible:ring-[#009f52]',
        oranye: 'bg-[#ff8a2b] hover:bg-[#f57414] text-white focus-visible:ring-[#ff8a2b] shadow-md shadow-[#ff8a2b]/25 hover:shadow-lg hover:shadow-[#ff8a2b]/35',
        danger: 'bg-[#f0544f] hover:bg-[#dc3d38] text-white focus-visible:ring-red-500 shadow-md shadow-red-500/20',
        ghost: 'bg-transparent hover:bg-[#e6f8ef] text-[#14221b] hover:text-[#007b40]',
    }[varian];

    const warnaRiak = varian === 'secondary' || varian === 'mint' || varian === 'ghost'
        ? 'bg-[#009f52]/20'
        : 'bg-white/35';

    const ukuranClass = {
        sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-9',
        md: 'text-sm px-5 py-2 gap-2 h-11',
        lg: 'text-base px-6 py-3 gap-2.5 h-13',
    }[ukuran];

    const tanganiPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
        const kotak = e.currentTarget.getBoundingClientRect();
        const sisi = Math.max(kotak.width, kotak.height) * 2;
        setDaftarRiak((prev) => [
            ...prev,
            {
                id: e.timeStamp,
                x: e.clientX - kotak.left - sisi / 2,
                y: e.clientY - kotak.top - sisi / 2,
                ukuran: sisi,
            },
        ]);
        onPointerDown?.(e);
    };

    return (
        <motion.button
            ref={ref}
            type={type}
            disabled={nonaktif}
            whileHover={nonaktif ? undefined : { y: -1 }}
            whileTap={nonaktif ? undefined : { scale: 0.96 }}
            transition={PEGAS}
            onPointerDown={tanganiPointerDown}
            className={cn(basis, varianClass, ukuranClass, className)}
            {...props}
        >
            {daftarRiak.map((r) => (
                <span
                    key={r.id}
                    aria-hidden
                    className={cn('absolute rounded-full pointer-events-none animate-riak', warnaRiak)}
                    style={{ left: r.x, top: r.y, width: r.ukuran, height: r.ukuran }}
                    onAnimationEnd={() => setDaftarRiak((prev) => prev.filter((x) => x.id !== r.id))}
                />
            ))}

            {memuat ? (
                <>
                    <SpinnerTombol className="w-4 h-4 text-current mr-1.5" />
                    <span>{children}</span>
                </>
            ) : (
                <>
                    {ikon && <span className="inline-flex shrink-0">{ikon}</span>}
                    <span>{children}</span>
                </>
            )}
        </motion.button>
    );
});

Tombol.displayName = 'Tombol';
