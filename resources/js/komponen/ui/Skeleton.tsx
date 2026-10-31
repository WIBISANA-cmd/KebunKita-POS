import React from 'react';
import { cn } from '@/util/kelas';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'animate-kilau rounded-lg bg-[length:200%_100%] bg-[linear-gradient(100deg,#eaf0ec_30%,#f7fbf8_50%,#eaf0ec_70%)]',
                className
            )}
            {...props}
        />
    );
};
