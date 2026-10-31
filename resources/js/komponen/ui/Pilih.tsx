import React from 'react';
import { cn } from '@/util/kelas';

export interface PilihOpsi {
    nilai: string;
    label: string;
}

export interface PilihProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    pesanError?: string;
    opsi: PilihOpsi[];
    placeholderOpsi?: string;
}

export const Pilih = React.forwardRef<HTMLSelectElement, PilihProps>(({
    label,
    pesanError,
    opsi,
    placeholderOpsi,
    className,
    disabled,
    ...props
}, ref) => {
    return (
        <div className="w-full flex flex-col gap-1">
            {label && (
                <label className="text-[13px] font-semibold text-[#14221b]">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                disabled={disabled}
                className={cn(
                    'w-full h-11 bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] hover:border-[#c3d6cb] px-3.5 py-2 transition-[border-color,box-shadow,background-color] duration-200',
                    'focus:outline-none focus:border-[#009f52] focus:ring-4 focus:ring-[#009f52]/10',
                    'disabled:bg-[#f6f9f7] disabled:text-[#5f756b] disabled:cursor-not-allowed',
                    pesanError && 'border-red-500 focus:border-red-500 animate-goyang',
                    className
                )}
                {...props}
            >
                {placeholderOpsi && (
                    <option value="" disabled>
                        {placeholderOpsi}
                    </option>
                )}
                {opsi.map((item) => (
                    <option key={item.nilai} value={item.nilai}>
                        {item.label}
                    </option>
                ))}
            </select>
            {pesanError && (
                <span className="text-xs text-red-600 font-medium">{pesanError}</span>
            )}
        </div>
    );
});

Pilih.displayName = 'Pilih';

