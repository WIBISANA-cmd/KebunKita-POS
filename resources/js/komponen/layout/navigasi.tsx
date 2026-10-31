import React from 'react';
import { motion } from 'motion/react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Boxes,
    Truck,
    RotateCcw,
    Wallet,
    BarChart3,
    Settings,
    Sprout,
} from 'lucide-react';
import { cn } from '@/util/kelas';

export const daftarMenu = [
    { id: 'dashboard', label: 'Dashboard', ikon: LayoutDashboard },
    { id: 'kasir', label: 'Kasir', ikon: ShoppingCart },
    { id: 'produk', label: 'Produk', ikon: Package },
    { id: 'stok', label: 'Stok', ikon: Boxes },
    { id: 'pembelian', label: 'Pembelian', ikon: Truck },
    { id: 'retur', label: 'Retur', ikon: RotateCcw },
    { id: 'keuangan', label: 'Keuangan', ikon: Wallet },
    { id: 'laporan', label: 'Laporan', ikon: BarChart3 },
    { id: 'pengaturan', label: 'Pengaturan', ikon: Settings },
];

export const LogoBulat: React.FC<{ className?: string }> = ({ className }) => (
    <span className={cn('flex items-center justify-center rounded-full bg-white shadow-lg', className)}>
        <Sprout className="w-[58%] h-[58%] text-[#0e6b3e]" strokeWidth={2.25} />
    </span>
);

export const LogoKebunKita: React.FC<{ padaKlik?: () => void; className?: string }> = ({ padaKlik, className }) => (
    <motion.button
        type="button"
        onClick={padaKlik}
        initial="diam"
        whileHover="sorot"
        whileTap={{ scale: 0.96 }}
        className={cn('flex items-center gap-1.5 select-none shrink-0 text-[22px]', className)}
    >
        <motion.span
            className="inline-flex origin-bottom"
            variants={{
                diam: { rotate: 0, scale: 1 },
                sorot: { rotate: [0, -12, 9, -5, 0], scale: 1.1, transition: { duration: 0.6 } },
            }}
        >
            <Sprout className="w-[1.4em] h-[1.4em] text-[#009f52]" strokeWidth={2.25} />
        </motion.span>
        <span className="font-extrabold tracking-tight leading-none">
            <span className="text-[#009f52]">Kebun</span>
            <span className="text-[#14221b]">Kita</span>
        </span>
    </motion.button>
);
