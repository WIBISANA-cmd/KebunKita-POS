import React from 'react';
import { Skeleton } from './Skeleton';

export const SkeletonGrafik: React.FC<{ tinggi?: string }> = ({ tinggi = 'h-64' }) => {
    return (
        <div className={`w-full ${tinggi} bg-white rounded-2xl border border-[#edf2ef] shadow-kartu p-5 flex flex-col justify-between`}>
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="w-32 h-5 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
            </div>
            <div className="flex items-end justify-between gap-2 h-40 pt-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="w-full rounded-t"
                        style={{ height: `${25 + ((i * 13) % 65)}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

