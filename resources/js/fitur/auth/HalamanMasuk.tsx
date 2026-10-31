import React, { useRef, useState } from 'react';
import {
    motion,
    useAnimationControls,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type Variants,
} from 'motion/react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Tombol } from '@/komponen/ui/Tombol';
import { KURVA_HALUS, PEGAS } from '@/komponen/ui/Animasi';
import { usePopup } from '@/komponen/ui/PopupAlert';
import { LogoBulat } from '@/komponen/layout/navigasi';
import { apiClient, ambilCsrfCookie, ekstrakPesanError } from '@/layanan/apiClient';
import { cn } from '@/util/kelas';
import type { Pengguna, Cabang } from '@/tipe';

export interface HalamanMasukProps {
    padaSuksesMasuk: (pengguna: Pengguna, cabang: Cabang | null) => void;
}

// Tirai preloader baru terbuka sebagian saat konten mulai masuk.
const varianKelompok: Variants = {
    awal: {},
    tampil: { transition: { delayChildren: 0.3, staggerChildren: 0.07 } },
};

const varianButir: Variants = {
    awal: { opacity: 0, y: 18 },
    tampil: { opacity: 1, y: 0, transition: { duration: 0.5, ease: KURVA_HALUS } },
};

const GradienBentuk: React.FC<{ awalan: string }> = ({ awalan }) => (
    <defs>
        <linearGradient id={`${awalan}-depan`} x1="0" y1="0" x2="0.45" y2="1">
            <stop offset="0" stopColor="#0e6a3c" />
            <stop offset="0.55" stopColor="#0f7246" />
            <stop offset="1" stopColor="#1a9069" />
        </linearGradient>
        <linearGradient id={`${awalan}-belakang`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10804f" />
            <stop offset="1" stopColor="#0b6239" />
        </linearGradient>
        <linearGradient id={`${awalan}-sudut`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0c6c40" />
            <stop offset="1" stopColor="#1ba57d" />
        </linearGradient>
        <filter id={`${awalan}-bayangan`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="6" dy="6" stdDeviation="9" floodColor="#063a22" floodOpacity="0.28" />
        </filter>
    </defs>
);

const JALUR = {
    desktopBelakang: 'M505 300V600H150Z',
    desktopDepan: 'M-30-30H325L357 0C445 60 505 165 505 265C505 440 350 570 180 570C110 570 50 535-30 468Z',
    desktopSudut: 'M880-20H1070V430H1040C1030 190 950 55 880-20Z',
    mobileBelakang: 'M300 150V266H140Z',
    mobileDepan: 'M-14-14H207L221 0C262 35 286 80 286 125C286 205 235 266 150 266C65 266 0 205-14 120Z',
    mobileSudut: 'M-14 0C-9 50 16 95 48 130H-14Z',
};

export const HalamanMasuk: React.FC<HalamanMasukProps> = ({ padaSuksesMasuk }) => {
    const { tampilkan } = usePopup();
    const kurangiGerak = useReducedMotion();
    const kontrolForm = useAnimationControls();
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [ingatSaya, setIngatSaya] = useState(false);
    const [lihatPassword, setLihatPassword] = useState(false);
    const [memuat, setMemuat] = useState(false);
    const [berhasil, setBerhasil] = useState(false);

    const kursorX = useMotionValue(0);
    const kursorY = useMotionValue(0);
    const geserX = useSpring(useTransform(kursorX, [-0.5, 0.5], [-12, 12]), { stiffness: 90, damping: 18 });
    const geserY = useSpring(useTransform(kursorY, [-0.5, 0.5], [-9, 9]), { stiffness: 90, damping: 18 });
    const geserBalikX = useTransform(geserX, (v) => -v * 1.4);
    const geserBalikY = useTransform(geserY, (v) => -v * 1.4);

    const ikutiKursor = (e: React.PointerEvent<HTMLDivElement>) => {
        if (kurangiGerak || e.pointerType !== 'mouse') return;
        const kotak = e.currentTarget.getBoundingClientRect();
        kursorX.set((e.clientX - kotak.left) / kotak.width - 0.5);
        kursorY.set((e.clientY - kotak.top) / kotak.height - 0.5);
    };

    const getarkanForm = () => {
        if (!kurangiGerak) kontrolForm.start({ x: [0, -9, 9, -6, 6, -3, 0], transition: { duration: 0.42 } });
    };

    const tanganiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            getarkanForm();
            (email.trim() ? passwordRef : emailRef).current?.focus();
            tampilkan({
                tipe: 'peringatan',
                judul: 'Data Belum Lengkap',
                rincian: 'Isi email dan kata sandi Anda untuk melanjutkan.',
            });
            return;
        }

        setMemuat(true);

        try {
            await ambilCsrfCookie();
            const res = await apiClient.post('/auth/masuk', {
                email,
                password,
                ingat_saya: ingatSaya,
            });

            if (res.data?.data) {
                setBerhasil(true);
                const { pengguna, cabang } = res.data.data;
                setTimeout(() => padaSuksesMasuk(pengguna, cabang), kurangiGerak ? 0 : 480);
            }
        } catch (err) {
            getarkanForm();
            tampilkan({
                tipe: 'error',
                label: 'Akun Anda',
                judul: 'Gagal Masuk',
                rincian: ekstrakPesanError(err),
            });
        } finally {
            setMemuat(false);
        }
    };

    const infoAkun = (judul: string, rincian: string) => {
        tampilkan({ tipe: 'info', label: 'Bantuan Akun', judul, rincian, durasiMs: null });
    };

    const kelasPil =
        'w-full h-12 lg:h-14 rounded-full bg-[#bfe6da] px-12 text-center text-[15px] lg:text-lg font-medium text-[#0e6b3e] placeholder:text-[#1d7057] outline-none transition-[background-color,box-shadow,scale] duration-200 hover:bg-[#c9ebe1] focus:bg-[#d6f1e8] focus:scale-[1.02] focus:ring-4 focus:ring-[#12b088]/25 disabled:opacity-70';

    return (
        <div className="min-h-dvh lg:flex lg:items-center lg:justify-center bg-white lg:bg-[#e4ece7] lg:p-6 font-[Raleway]">
            <motion.div
                onPointerMove={ikutiKursor}
                initial={{ opacity: 0, scale: kurangiGerak ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: KURVA_HALUS }}
                className="relative min-h-dvh lg:min-h-0 w-full lg:w-[min(1010px,100%)] lg:aspect-[1010/570] bg-white lg:rounded-[32px] lg:shadow-2xl overflow-hidden flex flex-col lg:block"
            >
                {/* Bentuk desktop */}
                <svg viewBox="0 0 1010 570" preserveAspectRatio="none" aria-hidden className="hidden lg:block absolute inset-0 w-full h-full">
                    <GradienBentuk awalan="kk-d" />
                    <motion.g style={{ x: geserBalikX, y: geserBalikY }}>
                        <motion.path d={JALUR.desktopBelakang} fill="url(#kk-d-belakang)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
                    </motion.g>
                    <motion.g style={{ x: geserX, y: geserY }}>
                        <motion.path d={JALUR.desktopDepan} fill="url(#kk-d-depan)" filter="url(#kk-d-bayangan)" initial={{ x: -70, y: -40 }} animate={{ x: 0, y: 0 }} transition={{ duration: 0.8, ease: KURVA_HALUS }} />
                    </motion.g>
                    <motion.g style={{ x: geserBalikX, y: geserBalikY }}>
                        <motion.path d={JALUR.desktopSudut} fill="url(#kk-d-sudut)" initial={{ x: 90, y: -90 }} animate={{ x: 0, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: KURVA_HALUS }} />
                    </motion.g>
                </svg>

                {/* Bentuk mobile */}
                <svg viewBox="0 0 286 266" preserveAspectRatio="none" aria-hidden className="lg:hidden absolute top-0 inset-x-0 w-full h-[46dvh] min-h-[260px]">
                    <GradienBentuk awalan="kk-m" />
                    <path d={JALUR.mobileBelakang} fill="url(#kk-m-belakang)" />
                    <motion.path d={JALUR.mobileDepan} fill="url(#kk-m-depan)" filter="url(#kk-m-bayangan)" initial={{ y: -70 }} animate={{ y: 0 }} transition={{ duration: 0.75, ease: KURVA_HALUS }} />
                </svg>
                <svg viewBox="0 0 48 130" preserveAspectRatio="none" aria-hidden className="lg:hidden absolute bottom-0 left-0 w-[17vw] h-[23dvh]">
                    <GradienBentuk awalan="kk-s" />
                    <motion.path d={JALUR.mobileSudut} fill="url(#kk-s-sudut)" initial={{ x: -50 }} animate={{ x: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: KURVA_HALUS }} />
                </svg>

                {/* Panel sambutan */}
                <motion.section
                    variants={varianKelompok}
                    initial="awal"
                    animate="tampil"
                    className="relative shrink-0 h-[46dvh] min-h-[260px] lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[46.5%] flex flex-col items-center justify-center lg:justify-start lg:pt-[7.4%] px-8 text-white text-center"
                >
                    <motion.div variants={varianButir}>
                        <motion.div
                            animate={kurangiGerak ? undefined : { y: [0, -5, 0] }}
                            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                            whileHover={{ scale: 1.08, rotate: -6 }}
                        >
                            <LogoBulat className="w-[72px] h-[72px] lg:w-[80px] lg:h-[80px] mx-auto" />
                        </motion.div>
                        <div className="mt-2 lg:mt-3 text-xl lg:text-2xl font-semibold">kebunkita</div>
                    </motion.div>

                    <motion.h1 variants={varianButir} className="hidden lg:block mt-[9%] text-[38px] leading-tight font-semibold">
                        Selamat Datang!
                    </motion.h1>
                    <motion.p variants={varianButir} className="hidden lg:block mt-3 text-base leading-snug text-white/90">
                        Tetap terhubung dengan toko Anda,
                        <br />
                        masuk dengan akun pribadi Anda
                    </motion.p>
                    <motion.div variants={varianButir} className="hidden lg:block w-[74%] mt-[9%]">
                        <motion.button
                            type="button"
                            onClick={() => emailRef.current?.focus()}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            transition={PEGAS}
                            className="w-full h-11 rounded-full border border-white/90 text-sm font-semibold tracking-wider transition-colors duration-200 hover:bg-white hover:text-[#0e6b3e] outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            MULAI
                        </motion.button>
                    </motion.div>
                    <motion.div variants={varianButir} className="hidden lg:block mt-[8%] text-xs">
                        KASIR <b>CEPAT</b>
                        <span className="mx-3">|</span>
                        STOK <b>FEFO</b>
                    </motion.div>
                </motion.section>

                {/* Form masuk */}
                <motion.section
                    variants={varianKelompok}
                    initial="awal"
                    animate="tampil"
                    className="relative flex-1 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[53.5%] flex flex-col items-center justify-center px-9 lg:px-[9%] py-6 lg:py-0 text-center"
                >
                    <motion.h2 variants={varianButir} className="text-[34px] lg:text-[52px] leading-none font-bold text-[#0e6b3e]">
                        masuk
                    </motion.h2>
                    <motion.p variants={varianButir} className="mt-2 text-sm lg:text-lg text-[#14221b]">
                        Masuk ke akun Anda untuk melanjutkan
                    </motion.p>

                    <motion.form animate={kontrolForm} onSubmit={tanganiSubmit} noValidate className="w-full max-w-[400px] mt-6 lg:mt-9 flex flex-col items-center">
                        <motion.div variants={varianButir} className="w-full">
                            <input
                                ref={emailRef}
                                type="email"
                                aria-label="Email"
                                autoComplete="username"
                                placeholder="Email................"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={memuat || berhasil}
                                className={kelasPil}
                            />
                        </motion.div>

                        <motion.div variants={varianButir} className="relative w-full mt-3.5 lg:mt-6">
                            <input
                                ref={passwordRef}
                                type={lihatPassword ? 'text' : 'password'}
                                aria-label="Kata sandi"
                                autoComplete="current-password"
                                placeholder="Kata sandi................"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={memuat || berhasil}
                                className={kelasPil}
                            />
                            <motion.button
                                type="button"
                                aria-label={lihatPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                onClick={() => setLihatPassword(!lihatPassword)}
                                whileTap={{ scale: 0.85 }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#0e6b3e] hover:bg-white/50 transition-colors"
                            >
                                {lihatPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                            </motion.button>
                        </motion.div>

                        <motion.div variants={varianButir} className="mt-3 lg:mt-4 flex items-center justify-center gap-4 text-xs lg:text-[13px] text-[#14221b]">
                            <label className="flex items-center gap-1.5 select-none">
                                <input
                                    type="checkbox"
                                    checked={ingatSaya}
                                    onChange={(e) => setIngatSaya(e.target.checked)}
                                    disabled={memuat || berhasil}
                                    className="accent-[#12b088] w-3.5 h-3.5"
                                />
                                Ingat saya
                            </label>
                            <button
                                type="button"
                                onClick={() =>
                                    infoAkun(
                                        'Lupa Kata Sandi?',
                                        'Minta pemilik toko mengganti kata sandi Anda lewat menu Pengaturan.'
                                    )
                                }
                                className="hover:text-[#0e6b3e] hover:underline underline-offset-2 transition-colors"
                            >
                                Lupa kata sandi?
                            </button>
                        </motion.div>

                        <motion.div variants={varianButir} className="mt-5 lg:mt-7">
                            <Tombol
                                type="submit"
                                memuat={memuat}
                                disabled={berhasil}
                                ikon={berhasil ? <Check className="w-4 h-4" strokeWidth={3} /> : undefined}
                                className={cn(
                                    'kilap-lewat w-[170px] h-10 lg:h-11 rounded-full bg-[#12b088] hover:bg-[#0e9a76] shadow-[#12b088]/30 text-sm tracking-wider disabled:opacity-100',
                                    berhasil && 'bg-[#0e6b3e]'
                                )}
                            >
                                {berhasil ? 'BERHASIL' : 'MASUK'}
                            </Tombol>
                        </motion.div>
                    </motion.form>

                    <motion.p variants={varianButir} className="mt-3 lg:mt-3.5 text-[13px] lg:text-lg text-[#14221b]">
                        Belum punya akun?{' '}
                        <button
                            type="button"
                            onClick={() =>
                                infoAkun(
                                    'Akun Dibuat Pemilik Toko',
                                    'Minta pemilik toko membuatkan akun Anda lewat menu Pengaturan.'
                                )
                            }
                            className="font-semibold text-[#0e6b3e] hover:underline underline-offset-2"
                        >
                            hubungi pemilik
                        </button>
                    </motion.p>
                </motion.section>
            </motion.div>
        </div>
    );
};
