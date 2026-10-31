import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Tombol } from './Tombol';

export interface PesanKesalahanProps {
    pesan: string;
    padaUlangi?: () => void;
    className?: string;
}

export const PesanKesalahan: React.FC<PesanKesalahanProps> = ({
    pesan,
    padaUlangi,
    className,
}) => {
    return (
        <div className={`p-4 rounded-2xl bg-[#fff4f3] border border-red-100 text-red-800 flex items-start justify-between gap-3 text-xs animate-goyang ${className || ''}`}>
            <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{pesan}</span>
            </div>
            {padaUlangi && (
                <Tombol
                    varian="danger"
                    ukuran="sm"
                    onClick={padaUlangi}
                    ikon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
                >
                    Coba Lagi
                </Tombol>
            )}
        </div>
    );
};

