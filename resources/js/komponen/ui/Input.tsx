import React from 'react';
import { cn } from '@/util/kelas';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    pesanError?: string;
    bantuan?: string;
    ikonKiri?: React.ReactNode;
    ikonKanan?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    label,
    pesanError,
    bantuan,
    ikonKiri,
    ikonKanan,
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
            <div className="relative flex items-center">
                {ikonKiri && (
                    <div className="absolute left-3.5 text-[#5f756b] pointer-events-none flex items-center">
                        {ikonKiri}
                    </div>
                )}
                <input
                    ref={ref}
                    disabled={disabled}
                    className={cn(
                        'w-full h-11 bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] hover:border-[#c3d6cb] px-3.5 py-2 transition-[border-color,box-shadow,background-color] duration-200',
                        'placeholder:text-[#5f756b]/60 focus:outline-none focus:border-[#009f52] focus:ring-4 focus:ring-[#009f52]/10',
                        'disabled:bg-[#f6f9f7] disabled:text-[#5f756b] disabled:cursor-not-allowed',
                        ikonKiri && 'pl-10',
                        ikonKanan && 'pr-9',
                        pesanError && 'border-red-500 focus:border-red-500 focus:ring-red-500/15 animate-goyang',
                        className
                    )}
                    {...props}
                />
                {ikonKanan && (
                    <div className="absolute right-3 text-[#5f756b] flex items-center">
                        {ikonKanan}
                    </div>
                )}
            </div>
            {pesanError ? (
                <span className="text-xs text-red-600 font-medium">{pesanError}</span>
            ) : bantuan ? (
                <span className="text-xs text-[#5f756b]">{bantuan}</span>
            ) : null}
        </div>
    );
});

Input.displayName = 'Input';

