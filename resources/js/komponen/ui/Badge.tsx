import React from 'react';
import { cn } from '@/util/kelas';

export interface BadgeProps {
    varian?: 'sukses' | 'peringatan' | 'bahaya' | 'netral' | 'mint' | 'hijau' | 'merah';
    children: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    varian = 'netral',
    children,
    className,
}) => {
    const varianClass = {
        sukses: 'bg-[#e6f8ef] text-[#007b40] border-transparent',
        peringatan: 'bg-[#fff1e4] text-[#c25a0c] border-transparent',
        bahaya: 'bg-[#ffe9e8] text-[#d63b36] border-transparent',
        netral: 'bg-[#f1f4f2] text-[#3d4f46] border-transparent',
        mint: 'bg-[#e6f8ef] text-[#007b40] border-transparent',
        hijau: 'bg-[#009f52] text-white border-transparent',
        merah: 'bg-[#f0544f] text-white border-transparent',
    }[varian];

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border select-none',
                varianClass,
                className
            )}
        >
            {children}
        </span>
    );
};

