import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { PEGAS } from './Animasi';
import { cn } from '@/util/kelas';

export interface DialogProps {
    terbuka: boolean;
    padaTutup: () => void;
    judul?: string;
    deskripsi?: string;
    children: React.ReactNode;
    lebarMaks?: string;
}

export const Dialog: React.FC<DialogProps> = ({
    terbuka,
    padaTutup,
    judul,
    deskripsi,
    children,
    lebarMaks = 'max-w-md',
}) => {
    useEffect(() => {
        const tanganiKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && terbuka) {
                padaTutup();
            }
        };
        window.addEventListener('keydown', tanganiKeydown);
        return () => window.removeEventListener('keydown', tanganiKeydown);
    }, [terbuka, padaTutup]);

    // Portal menjaga dialog tetap menutup layar walau leluhurnya sedang ditransformasi animasi.
    return createPortal(
        <AnimatePresence>
            {terbuka && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label={judul}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    exit={{ pointerEvents: 'none' }}
                >
                    <motion.div
                        className="fixed inset-0 bg-[#14221b]/40 backdrop-blur-xs"
                        onClick={padaTutup}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 28 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14, transition: { duration: 0.14 } }}
                        transition={PEGAS}
                        className={cn(
                            'relative w-full max-h-[calc(100vh-2rem)] overflow-y-auto scroll-tipis bg-white rounded-3xl shadow-2xl p-6 z-10',
                            lebarMaks
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                {judul && <h3 className="text-xl font-extrabold text-[#14221b]">{judul}</h3>}
                                {deskripsi && <p className="text-sm text-[#5f756b] mt-1">{deskripsi}</p>}
                            </div>
                            <motion.button
                                type="button"
                                onClick={padaTutup}
                                whileHover={{ rotate: 90 }}
                                whileTap={{ scale: 0.88 }}
                                transition={PEGAS}
                                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#f1f4f2] text-[#5f756b] hover:text-[#14221b] hover:bg-[#e6f8ef] transition-colors"
                                aria-label="Tutup"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        <div className="mt-5">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
