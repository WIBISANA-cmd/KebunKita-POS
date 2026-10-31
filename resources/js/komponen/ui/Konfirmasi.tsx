import React from 'react';
import { Dialog } from './Dialog';
import { Tombol } from './Tombol';
import { AlertTriangle } from 'lucide-react';

export interface KonfirmasiProps {
    terbuka: boolean;
    judul: string;
    pesan: string;
    padaBatal: () => void;
    padaSetuju: () => void;
    memuat?: boolean;
    labelSetuju?: string;
    labelBatal?: string;
    varian?: 'danger' | 'primary';
}

export const Konfirmasi: React.FC<KonfirmasiProps> = ({
    terbuka,
    judul,
    pesan,
    padaBatal,
    padaSetuju,
    memuat = false,
    labelSetuju = 'Ya, Lanjutkan',
    labelBatal = 'Batal',
    varian = 'danger',
}) => {
    return (
        <Dialog terbuka={terbuka} padaTutup={padaBatal} lebarMaks="max-w-sm">
            <div className="flex flex-col items-center text-center p-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                    varian === 'danger' ? 'bg-[#ffe9e8] text-[#f0544f]' : 'bg-[#e6f8ef] text-[#009f52]'
                }`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-[#14221b] mb-1">{judul}</h4>
                <p className="text-sm text-[#5f756b] mb-6">{pesan}</p>

                <div className="flex gap-2 w-full">
                    <Tombol
                        varian="secondary"
                        ukuran="md"
                        className="flex-1"
                        onClick={padaBatal}
                        disabled={memuat}
                    >
                        {labelBatal}
                    </Tombol>
                    <Tombol
                        varian={varian}
                        ukuran="md"
                        className="flex-1"
                        onClick={padaSetuju}
                        memuat={memuat}
                    >
                        {labelSetuju}
                    </Tombol>
                </div>
            </div>
        </Dialog>
    );
};

