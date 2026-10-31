import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { PEGAS, varianMuncul } from './Animasi';
import { cn } from '@/util/kelas';

export interface KartuProps extends HTMLMotionProps<'div'> {
    interaktif?: boolean;
    terpilih?: boolean;
}

export const Kartu: React.FC<KartuProps> = ({
    children,
    interaktif = false,
    terpilih = false,
    className,
    ...props
}) => {
    return (
        <motion.div
            variants={varianMuncul}
            whileHover={interaktif ? { y: -3 } : undefined}
            whileTap={interaktif ? { scale: 0.985 } : undefined}
            transition={PEGAS}
            className={cn(
                'bg-white rounded-2xl border border-[#edf2ef] shadow-kartu p-4 transition-[border-color,box-shadow,background-color] duration-200',
                interaktif && 'cursor-pointer hover:border-[#b8eed3] hover:shadow-kartu-angkat',
                terpilih && 'border-2 border-[#5fd39a] bg-[#eefaf3]',
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
