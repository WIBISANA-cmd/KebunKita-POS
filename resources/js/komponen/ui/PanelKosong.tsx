import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Tombol } from './Tombol';

export interface PanelKosongProps {
    judul: string;
    deskripsi: string;
    ikon?: React.ReactNode;
    labelAksi?: string;
    padaKlikAksi?: () => void;
}

export const PanelKosong: React.FC<PanelKosongProps> = ({
    judul,
    deskripsi,
    ikon,
    labelAksi,
    padaKlikAksi,
}) => {
    return (
        <div className="w-full flex flex-col items-center justify-center px-6 py-12 text-center bg-white rounded-2xl border border-[#edf2ef] shadow-kartu animate-muncul-naik">
            <div className="w-16 h-16 rounded-full bg-[#e6f8ef] text-[#009f52] flex items-center justify-center mb-4 animate-mengambang">
                {ikon || <PackageOpen className="w-6 h-6" />}
            </div>
            <h4 className="text-base font-bold text-[#14221b] mb-1">{judul}</h4>
            <p className="text-sm text-[#5f756b] max-w-sm mb-5">{deskripsi}</p>
            {labelAksi && padaKlikAksi && (
                <Tombol varian="mint" ukuran="sm" onClick={padaKlikAksi}>
                    {labelAksi}
                </Tombol>
            )}
        </div>
    );
};

