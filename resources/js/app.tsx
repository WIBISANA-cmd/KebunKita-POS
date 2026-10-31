import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { KerangkaHalaman } from '@/komponen/layout/KerangkaHalaman';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PenyediaPopup, usePopup } from '@/komponen/ui/PopupAlert';
import { HalamanMasuk } from '@/fitur/auth/HalamanMasuk';
import { HalamanPengguna } from '@/fitur/pengguna/HalamanPengguna';
import { HalamanProduk } from '@/fitur/produk/HalamanProduk';
import { HalamanStok } from '@/fitur/stok/HalamanStok';
import { HalamanPembelian } from '@/fitur/pembelian/HalamanPembelian';
import { HalamanRetur } from '@/fitur/retur/HalamanRetur';
import { HalamanDashboard } from '@/fitur/dashboard/HalamanDashboard';
import { HalamanLaporan } from '@/fitur/laporan/HalamanLaporan';
import HalamanKasir from '@/fitur/kasir/HalamanKasir';
import { varianHalaman } from '@/komponen/ui/Animasi';
import { Preloader } from '@/komponen/layout/Preloader';
import { apiClient, ambilCsrfCookie, EVENT_SESI_BERAKHIR } from '@/layanan/apiClient';
import type { Pengguna, Cabang, ShiftKasir } from '@/tipe';


export const App: React.FC = () => {
    const [halamanAktif, setHalamanAktif] = useState<string>('dashboard');
    const [pengguna, setPengguna] = useState<Pengguna | null>(null);
    const [cabangAktif, setCabangAktif] = useState<Cabang | null>(null);
    const [shiftAktif, setShiftAktif] = useState<ShiftKasir | null>(null);
    const [sedangMemuatSesi, setSedangMemuatSesi] = useState<boolean>(true);
    const [preloaderSelesai, setPreloaderSelesai] = useState(false);
    const { tampilkan } = usePopup();
    const sudahMasukRef = useRef(false);
    sudahMasukRef.current = pengguna !== null;

    const tambahToast = (tipe: 'sukses' | 'error' | 'info', pesan: string) => {
        tampilkan({ tipe, judul: pesan });
    };

    const tutupPreloader = useCallback(() => setPreloaderSelesai(true), []);

    // Ambil data sesi awal saat aplikasi dimuat
    useEffect(() => {
        async function inisialisasi() {
            try {
                await ambilCsrfCookie();
                const res = await apiClient.get('/auth/saya');
                if (res.data?.data) {
                    setPengguna(res.data.data.pengguna);
                    setCabangAktif(res.data.data.cabang);
                    setShiftAktif(res.data.data.shift_aktif);
                }
            } catch (err) {
                // Pengguna belum login atau guest
            } finally {
                setSedangMemuatSesi(false);
            }
        }
        inisialisasi();
    }, []);

    // Sesi berakhir di tengah pemakaian (respons 401) -> kembali ke halaman masuk
    useEffect(() => {
        const tanganiSesiBerakhir = () => {
            if (sudahMasukRef.current) {
                tampilkan({
                    tipe: 'peringatan',
                    judul: 'Sesi Anda Berakhir',
                    rincian: 'Silakan masuk kembali untuk melanjutkan pekerjaan.',
                });
            }
            setPengguna(null);
            setCabangAktif(null);
            setShiftAktif(null);
        };
        window.addEventListener(EVENT_SESI_BERAKHIR, tanganiSesiBerakhir);
        return () => window.removeEventListener(EVENT_SESI_BERAKHIR, tanganiSesiBerakhir);
    }, [tampilkan]);

    const tanganiKeluar = async () => {
        try {
            await apiClient.post('/auth/keluar');
            tambahToast('info', 'Anda telah berhasil keluar.');
        } catch (err) {
            // sesi sudah tidak valid di server; tetap keluarkan dari tampilan
        } finally {
            setPengguna(null);
            setCabangAktif(null);
            setShiftAktif(null);
            setHalamanAktif('dashboard');
        }
    };

    const tanganiSuksesMasuk = (usr: Pengguna, cab: Cabang | null) => {
        setPengguna(usr);
        setCabangAktif(cab);
        setHalamanAktif('dashboard');
        tampilkan({
            tipe: 'sukses',
            label: 'Selamat Datang Kembali',
            judul: usr.nama,
            rincian: cab?.nama,
        });
    };

    const lapisPreloader = (
        <AnimatePresence>
            {!preloaderSelesai && <Preloader sesiSiap={!sedangMemuatSesi} padaSelesai={tutupPreloader} />}
        </AnimatePresence>
    );

    // Halaman pertama selalu halaman masuk; aplikasi baru terbuka setelah sesi valid.
    if (!preloaderSelesai) return lapisPreloader;

    if (!pengguna) {
        return (
            <>
                {lapisPreloader}
                <KerangkaHalaman
                    modeTampilan="polos"
                    halamanAktif="masuk"
                    padaPilihHalaman={setHalamanAktif}
                    pengguna={null}
                    cabangAktif={null}
                    shiftAktif={null}
                    padaKeluar={tanganiKeluar}
                >
                    <HalamanMasuk padaSuksesMasuk={tanganiSuksesMasuk} />
                </KerangkaHalaman>
            </>
        );
    }

    const modeTampilan = halamanAktif === 'kasir' ? 'penuh' : 'standar';

    return (
        <>
        {lapisPreloader}
        <KerangkaHalaman
            modeTampilan={modeTampilan}
            halamanAktif={halamanAktif}
            padaPilihHalaman={setHalamanAktif}
            pengguna={pengguna}
            cabangAktif={cabangAktif}
            shiftAktif={shiftAktif}
            padaKeluar={tanganiKeluar}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={halamanAktif}
                    variants={varianHalaman}
                    initial="awal"
                    animate="tampil"
                    exit="keluar"
                    className={halamanAktif === 'kasir' ? 'lg:h-full' : undefined}
                >
            {halamanAktif === 'dashboard' && (
                <div id="halaman-dashboard">
                    <HalamanDashboard padaPilihHalaman={setHalamanAktif} />
                </div>
            )}

            {halamanAktif === 'kasir' && (
                <div id="halaman-kasir" className="lg:h-full">
                    <HalamanKasir pengguna={pengguna} cabang={cabangAktif} />
                </div>
            )}

            {halamanAktif === 'produk' && (
                <div id="halaman-produk" className="space-y-3">
                    <HalamanProduk tambahToast={tambahToast} />
                </div>
            )}

            {halamanAktif === 'stok' && (
                <div id="halaman-stok" className="space-y-3">
                    <HalamanStok tambahToast={tambahToast} />
                </div>
            )}

            {halamanAktif === 'pembelian' && (
                <div id="halaman-pembelian" className="space-y-3">
                    <HalamanPembelian tambahToast={tambahToast} />
                </div>
            )}

            {halamanAktif === 'retur' && (
                <div id="halaman-retur" className="space-y-3">
                    <HalamanRetur tambahToast={tambahToast} />
                </div>
            )}

            {halamanAktif === 'keuangan' && (
                <div id="halaman-keuangan" className="space-y-3">
                    <PanelKosong
                        judul="Keuangan Operasional & Shift"
                        deskripsi="Rekonsiliasi kas laci kasir dan pengeluaran operasional toko."
                    />
                </div>
            )}

            {halamanAktif === 'laporan' && (
                <div id="halaman-laporan" className="space-y-3">
                    <HalamanLaporan tambahToast={tambahToast} />
                </div>
            )}

            {halamanAktif === 'pengaturan' && (
                <div id="halaman-pengaturan" className="space-y-3">
                    <HalamanPengguna
                        penggunaSaatIni={pengguna}
                        tambahToast={tambahToast}
                    />
                </div>
            )}
                </motion.div>
            </AnimatePresence>
        </KerangkaHalaman>
        </>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) {
    createRoot(rootEl).render(
        <MotionConfig reducedMotion="user">
            <PenyediaPopup>
                <App />
            </PenyediaPopup>
        </MotionConfig>
    );
}
