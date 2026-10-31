import React from 'react';
import { cn } from '@/util/kelas';

export interface KolomTabel<T> {
    kunci: string;
    judul: string;
    render?: (baris: T) => React.ReactNode;
    lebar?: string;
    rataKanan?: boolean;
}

export interface TabelProps<T> {
    kolom: KolomTabel<T>[];
    data: T[];
    kunciUnik: (baris: T) => string;
    padaKlikBaris?: (baris: T) => void;
    pesanKosong?: string;
}

export function Tabel<T>({
    kolom,
    data,
    kunciUnik,
    padaKlikBaris,
    pesanKosong = 'Tidak ada data untuk ditampilkan.',
}: TabelProps<T>) {
    return (
        <div className="w-full overflow-x-auto scroll-tipis rounded-2xl border border-[#edf2ef] bg-white shadow-kartu">
            <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                    <tr>
                        {kolom.map((col) => (
                            <th
                                key={col.kunci}
                                className={cn('px-5 py-3.5 whitespace-nowrap', col.lebar, col.rataKanan && 'text-right')}
                            >
                                {col.judul}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#eef3f0] text-[#14221b]">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={kolom.length}
                                className="px-5 py-10 text-center text-[#5f756b]"
                            >
                                {pesanKosong}
                            </td>
                        </tr>
                    ) : (
                        data.map((baris) => (
                            <tr
                                key={kunciUnik(baris)}
                                onClick={padaKlikBaris ? () => padaKlikBaris(baris) : undefined}
                                className={cn(
                                    'transition-colors',
                                    padaKlikBaris ? 'cursor-pointer hover:bg-[#eefaf3]' : 'hover:bg-[#f9fbfa]'
                                )}
                            >
                                {kolom.map((col) => (
                                    <td
                                        key={col.kunci}
                                        className={cn('px-5 py-3.5 align-middle', col.rataKanan && 'text-right')}
                                    >
                                        {col.render ? col.render(baris) : (baris as any)[col.kunci]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

