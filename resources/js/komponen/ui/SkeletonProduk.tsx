import React from 'react';
import { Skeleton } from './Skeleton';

export const SkeletonProduk: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl border border-[#edf2ef] shadow-kartu p-4 flex flex-col items-center justify-between h-[248px]">
            <Skeleton className="w-28 h-28 rounded-full mt-1" />
            <div className="w-full flex flex-col items-center gap-1.5 mt-2">
                <Skeleton className="w-3/4 h-4 rounded" />
                <Skeleton className="w-1/2 h-3.5 rounded" />
            </div>
            <Skeleton className="w-full h-10 rounded-xl mt-3" />
        </div>
    );
};

