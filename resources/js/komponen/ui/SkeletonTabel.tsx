import React from 'react';
import { Skeleton } from './Skeleton';

export const SkeletonTabel: React.FC<{ baris?: number; kolom?: number }> = ({ baris = 5, kolom = 4 }) => {
    return (
        <div className="w-full space-y-2.5">
            {Array.from({ length: baris }).map((_, rIdx) => (
                <div key={rIdx} className="flex gap-4 items-center px-5 py-3.5 border-b border-[#eef3f0]">
                    {Array.from({ length: kolom }).map((_, cIdx) => (
                        <Skeleton
                            key={cIdx}
                            className={`h-4 rounded ${cIdx === 0 ? 'w-1/4' : cIdx === 1 ? 'w-1/3' : 'w-1/5'}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

