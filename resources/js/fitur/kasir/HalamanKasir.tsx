import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { 
    Search, 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    DollarSign,
    Printer, 
    Scale, 
    Lock, 
    ArrowDownRight, 
    ArrowUpRight,
    MapPin,
    ExternalLink,
    X,
    LayoutGrid,
    Apple,
    Salad,
    Sparkles,
    Wheat,
    Package
} from 'lucide-react';
import { apiClient } from '@/layanan/apiClient';
import { 
    type Produk, 
    type KategoriProduk, 
    type ShiftKasir, 
    type MetodeBayar, 
    type Pelanggan, 
    type Pengguna, 
    type Cabang 
} from '@/tipe';
import { Tombol } from '@/komponen/ui/Tombol';
import { Input } from '@/komponen/ui/Input';
import { Dialog } from '@/komponen/ui/Dialog';
import { SkeletonProduk } from '@/komponen/ui/SkeletonProduk';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman, useNilaiTertunda } from '@/komponen/ui/Paginasi';
import { AngkaBerjalan, KURVA_HALUS, PEGAS } from '@/komponen/ui/Animasi';
import { usePopup } from '@/komponen/ui/PopupAlert';
import { StrukNota, cetakStruk, type DataStruk } from './StrukNota';

interface ItemKeranjangPOS {
    produk_id: string;
    satuan_produk_id: string;
    nama: string;
    kode_satuan: string;
    tipe_jual: 'timbang' | 'satuan';
    qty: string;
    harga_satuan_rp: string;
    diskon_rp: string;
    total_rp: string;
    foto_url: string | null;
}

interface FotoTerbang {
    id: number;
    fotoUrl: string | null;
    kiri: number;
    atas: number;
    ukuran: number;
    geserX: number;
    geserY: number;
}

export default function HalamanKasir({ pengguna, cabang }: { pengguna: Pengguna | null; cabang: Cabang | null }) {
    const { tampilkan, konfirmasi } = usePopup();

    // Data Master & Kasir State
    const [kategoriList, setKategoriList] = useState<KategoriProduk[]>([]);
    const [metodeBayarList, setMetodeBayarList] = useState<MetodeBayar[]>([]);
    const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
    const [shiftAktif, setShiftAktif] = useState<ShiftKasir | null>(null);

    // Filter & Navigasi
    const [kategoriTerpilih, setKategoriTerpilih] = useState<string>('semua');
    const [kataKunciCari, setKataKunciCari] = useState<string>('');

    // Katalog diambil per halaman dari server; pencarian mencakup seluruh produk termasuk barcode
    const cariTertunda = useNilaiTertunda(kataKunciCari.trim(), 250);
    const katalog = useDaftarBerhalaman<Produk>('/produk', {
        filter: {
            kategori_id: kategoriTerpilih === 'semua' ? undefined : kategoriTerpilih,
            q: cariTertunda,
        },
        perHalaman: 24,
    });
    const daftarProduk = katalog.data;
    const [tipePesanan, setTipePesanan] = useState<'dine_in' | 'take_away' | 'delivery' | 'custom'>('dine_in');
    const [pelangganTerpilih, setPelangganTerpilih] = useState<string>('');

    // Keranjang Belanja
    const [keranjang, setKeranjang] = useState<ItemKeranjangPOS[]>([]);
    const [diskonNotaRp, setDiskonNotaRp] = useState<string>('0');
    const [pajakNotaRp, setPajakNotaRp] = useState<string>('0');
    const [biayaLayananRp, setBiayaLayananRp] = useState<string>('0');

    // Modals
    const [dialogBukaShift, setDialogBukaShift] = useState(false);
    const [dialogTutupShift, setDialogTutupShift] = useState(false);
    const [dialogMutasiKas, setDialogMutasiKas] = useState(false);
    const [dialogTimbang, setDialogTimbang] = useState<{ terbuka: boolean; produk: Produk | null }>({ terbuka: false, produk: null });
    const [dialogBayar, setDialogBayar] = useState(false);
    const [dialogNota, setDialogNota] = useState<{ terbuka: boolean; struk: DataStruk | null }>({ terbuka: false, struk: null });

    // Forms
    const [inputModalAwal, setInputModalAwal] = useState('100000');
    const [inputSaldoFisik, setInputSaldoFisik] = useState('0');
    const [inputCatatanSelisih, setInputCatatanSelisih] = useState('');
    const [inputMutasiJenis, setInputMutasiJenis] = useState<'kas_masuk_manual' | 'kas_keluar_manual'>('kas_masuk_manual');
    const [inputMutasiNominal, setInputMutasiNominal] = useState('');
    const [inputMutasiKeterangan, setInputMutasiKeterangan] = useState('');
    const [inputQtyTimbang, setInputQtyTimbang] = useState('0.500');

    // Form Bayar
    const [metodeBayarTerpilihId, setMetodeBayarTerpilihId] = useState<string>('');
    const [inputUangDiterimaRp, setInputUangDiterimaRp] = useState<string>('');
    const [inputRefEksternal, setInputRefEksternal] = useState<string>('');

    // Loading & Status
    const [sedangSubmit, setSedangSubmit] = useState(false);
    const [pesanError, setPesanError] = useState<string | null>(null);

    const printAreaRef = useRef<HTMLDivElement>(null);
    const targetKeranjangRef = useRef<HTMLDivElement>(null);
    const daftarItemRef = useRef<HTMLDivElement>(null);
    const jumlahItemSebelumnya = useRef(0);
    const [daftarFotoTerbang, setDaftarFotoTerbang] = useState<FotoTerbang[]>([]);
    const kurangiGerak = useReducedMotion();

    // Muat data awal
    useEffect(() => {
        muatDataKatalogDanShift();
    }, []);

    const muatDataKatalogDanShift = async () => {
        setPesanError(null);
        try {
            const [resShift, resKategori, resMetode, resPelanggan] = await Promise.all([
                apiClient.get('/shift/aktif'),
                apiClient.get('/kategori'),
                apiClient.get('/metode-bayar'),
                apiClient.get('/pelanggan'),
            ]);

            setShiftAktif(resShift.data.data?.shift || null);
            setKategoriList(resKategori.data.data || []);
            
            const listMetode = resMetode.data.data || [];
            setMetodeBayarList(listMetode);
            if (listMetode.length > 0) {
                // Pilih tunai secara default
                const tunai = listMetode.find((m: MetodeBayar) => m.jenis === 'tunai');
                setMetodeBayarTerpilihId(tunai ? tunai.id : listMetode[0].id);
            }

            setPelangganList(resPelanggan.data.data || []);
        } catch (err: any) {
            setPesanError(err.response?.data?.pesan || 'Gagal memuat status kasir.');
        }
    };

    // Tambah item ke keranjang
    // Hanya hiasan: item sudah masuk keranjang sebelum foto selesai terbang.
    const terbangkanKeKeranjang = (produk: Produk, kartu: Element | null) => {
        const foto = kartu?.querySelector('[data-foto-produk]');
        const target = targetKeranjangRef.current;
        if (kurangiGerak || !foto || !target) return;

        const dari = foto.getBoundingClientRect();
        const ke = target.getBoundingClientRect();
        // Di layar kecil panel pesanan berada di bawah katalog dan bisa tidak terlihat
        if (ke.top < 0 || ke.bottom > window.innerHeight) return;

        setDaftarFotoTerbang((prev) => [
            ...prev,
            {
                id: performance.now(),
                fotoUrl: produk.foto_url,
                kiri: dari.left,
                atas: dari.top,
                ukuran: dari.width,
                geserX: ke.left + ke.width / 2 - (dari.left + dari.width / 2),
                geserY: ke.top + ke.height / 2 - (dari.top + dari.height / 2),
            },
        ]);
    };

    const handleKlikProduk = (produk: Produk, kartu: Element | null) => {
        if (!shiftAktif) {
            setDialogBukaShift(true);
            return;
        }

        if (produk.tipe_jual === 'timbang') {
            setDialogTimbang({ terbuka: true, produk });
            setInputQtyTimbang('0.500');
            return;
        }

        masukkanKeKeranjang(produk, '1.000');
        terbangkanKeKeranjang(produk, kartu);
    };

    // Item baru selalu terlihat: daftar bergulir halus ke baris paling bawah
    useEffect(() => {
        if (keranjang.length > jumlahItemSebelumnya.current) {
            daftarItemRef.current?.scrollTo({ top: daftarItemRef.current.scrollHeight, behavior: 'smooth' });
        }
        jumlahItemSebelumnya.current = keranjang.length;
    }, [keranjang.length]);

    const masukkanKeKeranjang = (produk: Produk, qtyString: string) => {
        const satuanUtama = produk.satuan_produk?.[0];
        if (!satuanUtama) {
            tampilkan({
                tipe: 'peringatan',
                judul: 'Produk Belum Bisa Dijual',
                rincian: `${produk.nama} belum memiliki konfigurasi satuan jual.`,
            });
            return;
        }

        const hargaAktif = satuanUtama.harga_aktif?.harga_rp || '0';

        setKeranjang((prev) => {
            const indeksAda = prev.findIndex((item) => item.satuan_produk_id === satuanUtama.id);
            if (indeksAda >= 0) {
                const updated = [...prev];
                const itemLama = updated[indeksAda];
                const qtyBaru = (parseFloat(itemLama.qty) + parseFloat(qtyString)).toFixed(3);
                const totalBaru = Math.round(parseFloat(qtyBaru) * parseFloat(itemLama.harga_satuan_rp) - parseFloat(itemLama.diskon_rp)).toString();
                updated[indeksAda] = {
                    ...itemLama,
                    qty: qtyBaru,
                    total_rp: totalBaru,
                };
                return updated;
            } else {
                const totalRp = Math.round(parseFloat(qtyString) * parseFloat(hargaAktif)).toString();
                return [
                    ...prev,
                    {
                        produk_id: produk.id,
                        satuan_produk_id: satuanUtama.id,
                        nama: produk.nama,
                        kode_satuan: produk.satuan_dasar?.kode || 'pcs',
                        tipe_jual: produk.tipe_jual,
                        qty: qtyString,
                        harga_satuan_rp: hargaAktif,
                        diskon_rp: '0',
                        total_rp: totalRp,
                        foto_url: produk.foto_url,
                    },
                ];
            }
        });
    };

    const updateQtyKeranjang = (index: number, delta: number) => {
        setKeranjang((prev) => {
            const item = prev[index];
            const qtyFloat = parseFloat(item.qty);
            const langkah = item.tipe_jual === 'timbang' ? 0.1 : 1;
            const qtyBaruFloat = Math.max(langkah, qtyFloat + delta * langkah);
            const qtyBaru = qtyBaruFloat.toFixed(3);
            const totalBaru = Math.round(qtyBaruFloat * parseFloat(item.harga_satuan_rp) - parseFloat(item.diskon_rp)).toString();

            const updated = [...prev];
            updated[index] = {
                ...item,
                qty: qtyBaru,
                total_rp: totalBaru,
            };
            return updated;
        });
    };

    const hapusItemKeranjang = (index: number) => {
        setKeranjang((prev) => prev.filter((_, i) => i !== index));
    };

    const resetKeranjang = async () => {
        if (keranjang.length === 0) return;
        const setuju = await konfirmasi({
            judul: 'Kosongkan Pesanan?',
            rincian: `${keranjang.length} produk senilai ${formatRp(grandTotal)} akan dihapus dari pesanan ini.`,
            labelSetuju: 'Kosongkan',
            bahaya: true,
        });
        if (setuju) {
            setKeranjang([]);
            setDiskonNotaRp('0');
            setPajakNotaRp('0');
            setBiayaLayananRp('0');
        }
    };

    const handleSimpanDraftPesanan = () => {
        if (keranjang.length === 0) {
            tampilkan({ tipe: 'peringatan', judul: 'Keranjang Masih Kosong', rincian: 'Tambahkan produk terlebih dahulu.' });
            return;
        }
        tampilkan({
            tipe: 'peringatan',
            judul: 'Simpan Pesanan Belum Tersedia',
            rincian: 'Pesanan ini belum tersimpan. Biarkan halaman tetap terbuka sampai pembayaran selesai.',
        });
    };

    // Kalkulasi Total
    const subtotal = useMemo(() => {
        return keranjang.reduce((sum, item) => sum + parseFloat(item.total_rp), 0);
    }, [keranjang]);

    const grandTotal = useMemo(() => {
        const diskon = parseFloat(diskonNotaRp) || 0;
        const pajak = parseFloat(pajakNotaRp) || 0;
        const layanan = parseFloat(biayaLayananRp) || 0;
        return Math.max(0, subtotal - diskon + pajak + layanan);
    }, [subtotal, diskonNotaRp, pajakNotaRp, biayaLayananRp]);

    // Buka dialog bayar & set default uang diterima
    const bukaDialogBayar = () => {
        if (keranjang.length === 0) return;
        if (!shiftAktif) {
            setDialogBukaShift(true);
            return;
        }
        setInputUangDiterimaRp(grandTotal.toString());
        setDialogBayar(true);
    };

    // Proses Selesaikan Transaksi Penjualan
    const handleProsesBayar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sedangSubmit) return;

        const bayarNominal = grandTotal.toString();
        const diterimaNominal = inputUangDiterimaRp ? inputUangDiterimaRp : bayarNominal;

        if (parseFloat(diterimaNominal) < grandTotal) {
            tampilkan({
                tipe: 'peringatan',
                judul: 'Uang Diterima Kurang',
                rincian: `Tagihan ${formatRp(grandTotal)}, diterima ${formatRp(diterimaNominal)}. Kurang ${formatRp(grandTotal - parseFloat(diterimaNominal))}.`,
            });
            return;
        }

        setSedangSubmit(true);
        try {
            const payload = {
                tipe_pesanan: tipePesanan,
                pelanggan_id: pelangganTerpilih || null,
                diskon_rp: diskonNotaRp,
                pajak_rp: pajakNotaRp,
                idempotency_key: `POS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                items: keranjang.map((it) => ({
                    produk_id: it.produk_id,
                    satuan_produk_id: it.satuan_produk_id,
                    qty: it.qty,
                    diskon_rp: it.diskon_rp,
                })),
                pembayaran: [
                    {
                        metode_bayar_id: metodeBayarTerpilihId,
                        nilai_rp: bayarNominal,
                        diterima_rp: diterimaNominal,
                        ref_eksternal: inputRefEksternal || null,
                    },
                ],
            };

            const res = await apiClient.post('/penjualan', payload);
            const dataPenjualan = res.data.data;

            // Buka dialog nota untuk cetak
            setDialogNota({
                terbuka: true,
                struk: {
                    penjualan: dataPenjualan,
                    cabang,
                    namaKasir: pengguna?.nama ?? '-',
                    namaPelanggan: pelangganList.find((p) => p.id === pelangganTerpilih)?.nama ?? null,
                    tipePesanan,
                    biayaLayananRp: parseFloat(biayaLayananRp) || 0,
                },
            });

            // Reset keranjang
            setKeranjang([]);
            setDiskonNotaRp('0');
            setPajakNotaRp('0');
            setBiayaLayananRp('0');
            setPelangganTerpilih('');
            setDialogBayar(false);

            // Refresh shift aktif agar saldo sistem kasir terupdate
            const resShift = await apiClient.get('/shift/aktif');
            setShiftAktif(resShift.data.data?.shift || null);
        } catch (err: any) {
            tampilkan({
                tipe: 'error',
                judul: 'Transaksi Gagal',
                rincian: err.response?.data?.pesan || 'Gagal menyelesaikan transaksi penjualan.',
            });
        } finally {
            setSedangSubmit(false);
        }
    };

    // Aksi Buka Shift
    const handleBukaShift = async (e: React.FormEvent) => {
        e.preventDefault();
        setSedangSubmit(true);
        try {
            const res = await apiClient.post('/shift/buka', {
                modal_awal_rp: inputModalAwal,
            });
            setShiftAktif(res.data.data);
            setDialogBukaShift(false);
            tampilkan({
                tipe: 'sukses',
                label: 'Shift Kasir',
                judul: 'Berhasil Dibuka',
                rincian: `Modal awal laci ${formatRp(inputModalAwal)}`,
            });
        } catch (err: any) {
            tampilkan({
                tipe: 'error',
                judul: 'Shift Gagal Dibuka',
                rincian: err.response?.data?.pesan || 'Gagal membuka shift kasir.',
            });
        } finally {
            setSedangSubmit(false);
        }
    };

    // Aksi Tutup Shift
    const handleTutupShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shiftAktif) return;
        setSedangSubmit(true);
        try {
            await apiClient.post('/shift/tutup', {
                shift_id: shiftAktif.id,
                saldo_fisik_rp: inputSaldoFisik,
                catatan_selisih: inputCatatanSelisih || null,
            });
            setShiftAktif(null);
            setDialogTutupShift(false);
            tampilkan({
                tipe: 'sukses',
                label: 'Shift Kasir',
                judul: 'Berhasil Ditutup',
                rincian: `Saldo fisik ${formatRp(inputSaldoFisik)}, selisih ${formatRp(parseFloat(inputSaldoFisik) - parseFloat(shiftAktif.saldo_sistem_rp))}`,
            });
        } catch (err: any) {
            tampilkan({
                tipe: 'error',
                judul: 'Shift Gagal Ditutup',
                rincian: err.response?.data?.pesan || 'Gagal menutup shift kasir.',
            });
        } finally {
            setSedangSubmit(false);
        }
    };

    // Aksi Mutasi Kas Manual
    const handleSimpanMutasiKas = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shiftAktif) return;
        setSedangSubmit(true);
        try {
            await apiClient.post('/shift/mutasi-kas', {
                shift_id: shiftAktif.id,
                jenis: inputMutasiJenis,
                jumlah_rp: inputMutasiNominal,
                keterangan: inputMutasiKeterangan,
            });
            // Refresh shift
            const resShift = await apiClient.get('/shift/aktif');
            setShiftAktif(resShift.data.data?.shift || null);
            setDialogMutasiKas(false);
            tampilkan({
                tipe: 'sukses',
                label: inputMutasiJenis === 'kas_masuk_manual' ? 'Kas Masuk' : 'Kas Keluar',
                judul: 'Berhasil Dicatat',
                rincian: `${formatRp(inputMutasiNominal)} untuk ${inputMutasiKeterangan}`,
            });
            setInputMutasiNominal('');
            setInputMutasiKeterangan('');
        } catch (err: any) {
            tampilkan({
                tipe: 'error',
                judul: 'Mutasi Kas Gagal',
                rincian: err.response?.data?.pesan || 'Gagal mencatat mutasi kas.',
            });
        } finally {
            setSedangSubmit(false);
        }
    };

    // Cetak Nota Thermal
    const handleCetakNota = () => {
        cetakStruk(printAreaRef.current);
    };

    // Format Rupiah
    const formatRp = (angka: number | string) => {
        const val = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    // Pemetaan Ikon Kategori
    const dapatkanIkonKategori = (nama: string) => {
        const n = nama.toLowerCase();
        if (n.includes('sayur')) return Salad;
        if (n.includes('buah')) return Apple;
        if (n.includes('bumbu') || n.includes('rempah')) return Sparkles;
        if (n.includes('beras') || n.includes('biji') || n.includes('karbo')) return Wheat;
        return Package;
    };

    const daftarKategoriTile = [
        { id: 'semua', nama: 'Semua', Ikon: LayoutGrid },
        ...kategoriList.map((kat) => ({ id: kat.id, nama: kat.nama, Ikon: dapatkanIkonKategori(kat.nama) })),
    ];

    const totalQtyKeranjang = keranjang.reduce(
        (sum, it) => sum + (it.tipe_jual === 'timbang' ? 1 : Math.round(parseFloat(it.qty))),
        0
    );

    const formatQtyItem = (item: ItemKeranjangPOS) =>
        item.tipe_jual === 'timbang'
            ? `${parseFloat(item.qty).toLocaleString('id-ID', { maximumFractionDigits: 3 })} kg`
            : `${Math.round(parseFloat(item.qty))} ${item.kode_satuan}`;

    const formatRpBulat = (nilai: number) => formatRp(Math.round(nilai));

    const toggleLayarPenuh = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen?.();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row lg:h-full gap-3 p-3">
            {/* SISI KIRI: PENCARIAN, KATEGORI & KATALOG */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 lg:overflow-y-auto scroll-tipis">
                <Kartu className="shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#14221b]" strokeWidth={2} />
                        <input
                            type="text"
                            placeholder="Cari sayur, buah, SKU, atau barcode..."
                            value={kataKunciCari}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKataKunciCari(e.target.value)}
                            className="w-full h-11 pl-12 pr-4 rounded-xl text-[15px] bg-[#f6f9f7] border border-transparent placeholder:text-[#8a9b93] focus:outline-none focus:bg-white focus:border-[#009f52] focus:ring-4 focus:ring-[#009f52]/10 transition"
                        />
                    </div>

                        {shiftAktif ? (
                            <div className="self-start sm:self-auto flex items-center gap-1 pl-3 pr-1 h-9 rounded-full bg-[#f6f9f7] text-xs font-semibold text-[#14221b]">
                                <span className="w-2 h-2 rounded-full bg-[#009f52] animate-pulse" />
                                <span className="ml-1">Shift buka · Kas {formatRp(shiftAktif.saldo_sistem_rp)}</span>
                                <button
                                    onClick={() => setDialogMutasiKas(true)}
                                    title="Kas masuk / keluar laci"
                                    className="ml-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-[#e6f8ef] text-[#007b40] hover:bg-[#d2f3e2] transition-colors"
                                >
                                    <DollarSign className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setInputSaldoFisik(shiftAktif.saldo_sistem_rp);
                                        setDialogTutupShift(true);
                                    }}
                                    className="px-3 h-7 rounded-full text-[#d63b36] hover:bg-[#ffe9e8] transition-colors"
                                >
                                    Tutup Shift
                                </button>
                            </div>
                        ) : (
                            <div className="self-start sm:self-auto flex items-center gap-2 pl-3 pr-1 h-9 rounded-full bg-[#fff1e4] text-xs font-semibold text-[#c25a0c]">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Shift tutup</span>
                                <button
                                    onClick={() => setDialogBukaShift(true)}
                                    className="px-3 h-7 rounded-full bg-[#009f52] hover:bg-[#007b40] text-white transition-colors"
                                >
                                    Buka Shift
                                </button>
                            </div>
                        )}
                    </div>

                    <h2 className="mt-4 mb-3 text-xl font-extrabold text-[#14221b]">Kategori</h2>
                    <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                        {daftarKategoriTile.map(({ id, nama, Ikon }) => {
                            const terpilih = kategoriTerpilih === id;
                            return (
                                <motion.button
                                    key={id}
                                    type="button"
                                    onClick={() => setKategoriTerpilih(id)}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.94 }}
                                    transition={PEGAS}
                                    className={`group relative isolate flex flex-col items-center justify-center gap-2.5 w-[116px] h-[98px] shrink-0 rounded-2xl border-2 transition-colors ${
                                        terpilih
                                            ? 'border-transparent text-[#007b40]'
                                            : 'bg-white border-[#edf2ef] text-[#14221b] hover:border-[#c3eed7]'
                                    }`}
                                >
                                    {terpilih && (
                                        <motion.span
                                            layoutId="kategori-aktif"
                                            transition={PEGAS}
                                            className="absolute -inset-0.5 -z-10 rounded-2xl bg-[#e6f8ef] border-2 border-[#5fd39a]"
                                        />
                                    )}
                                    <Ikon
                                        className={`w-9 h-9 transition-[scale,rotate] duration-200 group-hover:scale-110 group-hover:-rotate-6 ${terpilih ? 'text-[#009f52]' : 'text-[#14221b]'}`}
                                        strokeWidth={1.6}
                                    />
                                    <span className="text-[15px] font-semibold truncate max-w-[100px]">{nama}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </Kartu>

                {/* KATALOG PRODUK */}
                <Kartu className="shrink-0">
                    <div className="mb-3 flex items-end justify-between gap-3">
                        <h2 className="text-xl font-extrabold text-[#14221b]">Pilihan Segar Hari Ini</h2>
                        <span className="text-sm text-[#5f756b] shrink-0">{(katalog.meta?.total_data ?? 0).toLocaleString('id-ID')} produk</span>
                    </div>

                    {pesanError && <PesanKesalahan pesan={pesanError} padaUlangi={muatDataKatalogDanShift} />}
                    {katalog.galat && <PesanKesalahan pesan={katalog.galat} padaUlangi={katalog.muatUlang} />}

                    {katalog.memuat && daftarProduk.length === 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <SkeletonProduk key={i} />
                            ))}
                        </div>
                    ) : daftarProduk.length === 0 ? (
                        <PanelKosong
                            judul="Tidak Ada Produk"
                            deskripsi={kataKunciCari ? `Tidak ditemukan produk untuk "${kataKunciCari}".` : 'Belum ada produk aktif dalam kategori ini.'}
                        />
                    ) : (
                        <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 transition-opacity duration-200 ${katalog.memuat ? 'opacity-60' : ''}`}>
                            {daftarProduk.map((produk, indeksKartu) => {
                                const satuanUtama = produk.satuan_produk?.[0];
                                const hargaJual = satuanUtama?.harga_aktif?.harga_rp || '0';
                                const itemDiKeranjang = keranjang.find((it) => it.produk_id === produk.id);

                                return (
                                    <div
                                        key={produk.id}
                                        data-kartu-produk
                                        onClick={(e) => handleKlikProduk(produk, e.currentTarget)}
                                        style={{ animationDelay: `${Math.min(indeksKartu, 11) * 26}ms` }}
                                        className={`animate-muncul-naik group relative rounded-2xl p-4 flex flex-col justify-between cursor-pointer select-none border-2 transition-[translate,scale,box-shadow,border-color,background-color] duration-200 hover:-translate-y-1 active:scale-[0.97] ${
                                            itemDiKeranjang
                                                ? 'bg-[#eefaf3] border-[#5fd39a]'
                                                : 'bg-white border-[#edf2ef] hover:border-[#c3eed7] hover:shadow-kartu-angkat'
                                        }`}
                                    >
                                        <AnimatePresence>
                                            {itemDiKeranjang && (
                                                <motion.span
                                                    key={itemDiKeranjang.qty}
                                                    initial={{ scale: 0.3 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                                                    className="absolute top-3 right-3 z-10 min-w-7 h-7 px-2 rounded-full bg-[#009f52] text-white text-xs font-bold flex items-center justify-center"
                                                >
                                                    {formatQtyItem(itemDiKeranjang).split(' ')[0]}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex flex-col items-center">
                                            <div data-foto-produk className="w-28 h-28 rounded-full overflow-hidden bg-[#f1f8f4] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-[scale,rotate] duration-300 ease-out">
                                                {produk.foto_url ? (
                                                    <img
                                                        src={produk.foto_url}
                                                        alt={produk.nama}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-5xl">🥬</span>
                                                )}
                                            </div>

                                            <h4 className="text-[15px] font-bold leading-snug text-[#14221b] text-center line-clamp-2 min-h-[2.6rem]">
                                                {produk.nama}
                                            </h4>

                                            <div className="mt-1 flex items-baseline gap-1">
                                                <span className="text-base font-extrabold text-[#009f52]">
                                                    {formatRp(hargaJual)}
                                                </span>
                                                <span className="text-xs text-[#5f756b]">
                                                    /{produk.tipe_jual === 'timbang' ? 'kg' : produk.satuan_dasar?.kode || 'pcs'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleKlikProduk(produk, e.currentTarget.closest('[data-kartu-produk]'));
                                            }}
                                            className="relative overflow-hidden kilap-lewat w-full mt-3 h-10 bg-[#009f52] hover:bg-[#007b40] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-[background-color,scale] duration-150"
                                        >
                                            {produk.tipe_jual === 'timbang' ? (
                                                <Scale className="w-4 h-4" />
                                            ) : (
                                                <ShoppingCart className="w-4 h-4" />
                                            )}
                                            <span>{produk.tipe_jual === 'timbang' ? 'Timbang' : 'Tambah'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Paginasi daftar={katalog} opsiPerHalaman={[12, 24, 48]} className="mt-4" />
                </Kartu>
            </div>

            {/* SISI KANAN: PANEL PESANAN */}
            <aside className="w-full lg:w-[380px] xl:w-[400px] shrink-0 bg-white rounded-2xl border border-[#edf2ef] shadow-kartu overflow-hidden lg:overflow-y-auto scroll-tipis flex flex-col lg:h-full">
                {/* HEADER: JUDUL & LOKASI TOKO */}
                <div className="px-5 pt-5 pendek:pt-3 shrink-0">
                    <h3 className="text-[26px] pendek:text-xl font-extrabold text-[#14221b] leading-tight">Pesanan Kasir</h3>
                    <div className="mt-3 flex items-start justify-between gap-3 pendek:hidden">
                        <div className="min-w-0">
                            <div className="text-lg font-bold text-[#14221b]">{cabang?.nama ?? 'Kebun Kita'}</div>
                            <div className="text-[13px] text-[#5f756b] leading-relaxed">
                                {cabang?.alamat}
                            </div>
                        </div>
                        <div className="w-14 h-14 shrink-0 rounded-full bg-[#e6f8ef] text-[#009f52] flex items-center justify-center">
                            <MapPin className="w-6 h-6" fill="currentColor" stroke="white" />
                        </div>
                    </div>

                    {/* BARIS AKSI */}
                    <div className="mt-4 pendek:mt-1 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={resetKeranjang}
                            disabled={keranjang.length === 0}
                            title="Kosongkan pesanan"
                            className="w-11 h-11 pendek:w-9 pendek:h-9 rounded-full bg-[#e6f8ef] text-[#14221b] flex items-center justify-center hover:bg-[#ffe9e8] hover:text-[#d63b36] transition-colors disabled:opacity-40 disabled:hover:bg-[#e6f8ef] disabled:hover:text-[#14221b]"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div ref={targetKeranjangRef} className="flex items-baseline gap-1.5 text-[#14221b]">
                            <motion.span
                                key={totalQtyKeranjang}
                                initial={{ scale: 1.5, color: '#009f52' }}
                                animate={{ scale: 1, color: '#14221b' }}
                                transition={{ type: 'spring', stiffness: 460, damping: 16 }}
                                className="text-lg font-bold inline-block"
                            >
                                {totalQtyKeranjang}
                            </motion.span>
                            <span className="text-sm text-[#5f756b]">item</span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleLayarPenuh}
                            title="Layar penuh"
                            className="w-11 h-11 pendek:w-9 pendek:h-9 rounded-full flex items-center justify-center text-[#14221b] hover:bg-[#f1f4f2] transition-colors"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    </div>

                    {/* TIPE PESANAN */}
                    <div className="mt-4 pendek:mt-1 flex items-center justify-between gap-1 text-sm">
                        {(['dine_in', 'take_away', 'delivery', 'custom'] as const).map((tipe) => {
                            const label = tipe === 'dine_in' ? 'Di Tempat' : tipe === 'take_away' ? 'Bawa Pulang' : tipe === 'delivery' ? 'Kirim' : 'Kustom';
                            const aktif = tipePesanan === tipe;
                            return (
                                <button
                                    key={tipe}
                                    type="button"
                                    onClick={() => setTipePesanan(tipe)}
                                    className={`relative isolate px-3 h-9 rounded-lg whitespace-nowrap transition-colors active:scale-95 ${
                                        aktif
                                            ? 'text-[#007b40] font-bold'
                                            : 'text-[#3d4f46] font-medium hover:text-[#14221b]'
                                    }`}
                                >
                                    {aktif && (
                                        <motion.span
                                            layoutId="tipe-pesanan-aktif"
                                            transition={PEGAS}
                                            className="absolute inset-0 -z-10 rounded-lg bg-[#e6f8ef]"
                                        />
                                    )}
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* PELANGGAN */}
                    <select
                        value={pelangganTerpilih}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPelangganTerpilih(e.target.value)}
                        className="mt-3 mb-4 pendek:mt-2 pendek:mb-2 w-full h-10 pendek:h-9 px-3 rounded-xl text-[13px] border border-[#e3ece7] bg-white focus:outline-none focus:border-[#009f52]"
                    >
                        <option value="">Pelanggan Umum (Tanpa Member)</option>
                        {pelangganList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama} {p.telepon ? `(${p.telepon})` : ''} - Poin: {p.poin}
                            </option>
                        ))}
                    </select>
                </div>

                {/* HEADER TABEL PESANAN */}
                <div className="shrink-0 bg-[#f1f4f2] px-5 h-11 pendek:h-8 flex items-center justify-between text-[15px] pendek:text-sm font-bold text-[#14221b]">
                    <span>Pesanan</span>
                    <span>Jumlah</span>
                    <span>Subtotal</span>
                </div>

                {/* DAFTAR ITEM */}
                <div ref={daftarItemRef} className="flex-1 min-h-[96px] overflow-y-auto scroll-tipis px-5">
                    {keranjang.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-3 animate-muncul-naik">
                            <div className="w-12 h-12 rounded-full bg-[#f1f8f4] flex items-center justify-center mb-2 animate-mengambang">
                                <ShoppingCart className="w-7 h-7 text-[#9fb5aa]" strokeWidth={1.6} />
                            </div>
                            <p className="text-sm font-semibold text-[#3d4f46]">Belum ada pesanan</p>
                            <p className="text-xs text-[#5f756b] mt-1">Pilih produk di katalog untuk menambahkan</p>
                        </div>
                    )}

                    <ul className="divide-y divide-[#eef3f0]">
                        <AnimatePresence initial={false}>
                            {keranjang.map((item, idx) => (
                                <motion.li
                                    key={item.satuan_produk_id}
                                    initial={{ opacity: 0, height: 0, x: 36 }}
                                    animate={{ opacity: 1, height: 'auto', x: 0 }}
                                    exit={{ opacity: 0, height: 0, x: 36, transition: { duration: 0.2 } }}
                                    transition={PEGAS}
                                    className="overflow-hidden"
                                >
                                    <div className="py-4 flex gap-3">
                                        <span className="text-[15px] font-semibold text-[#009f52] w-4 shrink-0">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-[15px] font-bold text-[#14221b] leading-snug line-clamp-2">
                                                    {item.nama}
                                                </span>
                                                <AngkaBerjalan
                                                    nilai={parseFloat(item.total_rp)}
                                                    format={formatRpBulat}
                                                    durasi={0.3}
                                                    className="text-[15px] font-bold text-[#14221b] whitespace-nowrap tabular-nums"
                                                />
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <motion.span
                                                        key={item.qty}
                                                        initial={{ scale: 0.8 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                                                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#009f52] text-white"
                                                    >
                                                        {formatQtyItem(item)}
                                                    </motion.span>
                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                                                        item.tipe_jual === 'timbang' ? 'bg-[#fff1e4] text-[#c25a0c]' : 'bg-[#f1f4f2] text-[#3d4f46]'
                                                    }`}>
                                                        @{formatRp(item.harga_satuan_rp)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => updateQtyKeranjang(idx, -1)}
                                                        aria-label="Kurangi jumlah"
                                                        whileTap={{ scale: 0.82 }}
                                                        className="w-7 h-7 rounded-full bg-[#e6f8ef] text-[#14221b] flex items-center justify-center hover:bg-[#d2f3e2] transition-colors"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </motion.button>
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => updateQtyKeranjang(idx, 1)}
                                                        aria-label="Tambah jumlah"
                                                        whileTap={{ scale: 0.82 }}
                                                        className="w-7 h-7 rounded-full bg-[#e6f8ef] text-[#14221b] flex items-center justify-center hover:bg-[#d2f3e2] transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </motion.button>
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => hapusItemKeranjang(idx)}
                                                        aria-label="Hapus item"
                                                        whileHover={{ rotate: 90 }}
                                                        whileTap={{ scale: 0.82 }}
                                                        transition={PEGAS}
                                                        className="w-7 h-7 rounded-full text-[#5f756b] flex items-center justify-center hover:bg-[#ffe9e8] hover:text-[#d63b36] transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </div>

                {/* RINGKASAN TAGIHAN */}
                <div className="shrink-0 px-5 pt-3 pb-4 border-t border-[#eef3f0] space-y-1.5 text-[15px]">
                    <div className="flex justify-between text-[#5f756b]">
                        <span>Sub Total</span>
                        <AngkaBerjalan nilai={subtotal} format={formatRpBulat} durasi={0.3} className="font-bold text-[#14221b] tabular-nums" />
                    </div>
                    <div className="space-y-1.5 pendek:space-y-0 pendek:grid pendek:grid-cols-3 pendek:gap-2">
                    {[
                        { label: 'Diskon', nilai: diskonNotaRp, ubah: setDiskonNotaRp },
                        { label: 'Biaya Layanan', nilai: biayaLayananRp, ubah: setBiayaLayananRp },
                        { label: 'Pajak', nilai: pajakNotaRp, ubah: setPajakNotaRp },
                    ].map((baris) => (
                        <div key={baris.label} className="flex justify-between items-center text-[#5f756b] pendek:flex-col pendek:items-start pendek:gap-0.5 pendek:text-xs">
                            <span>{baris.label}</span>
                            <div className="flex items-center gap-1 pendek:w-full">
                                <span className="text-xs">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={baris.nilai}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => baris.ubah(e.target.value)}
                                    className="w-24 h-8 pendek:w-full pendek:min-w-0 pendek:h-7 text-right px-2 rounded-lg bg-[#f6f9f7] border border-transparent font-bold text-[#14221b] text-sm focus:outline-none focus:border-[#009f52] focus:bg-white"
                                />
                            </div>
                        </div>
                    ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 mt-1 pendek:pt-1.5 pendek:mt-0 border-t border-[#eef3f0]">
                        <span className="text-xl font-extrabold text-[#14221b]">Total</span>
                        <AngkaBerjalan nilai={grandTotal} format={formatRpBulat} durasi={0.35} className="text-2xl font-extrabold text-[#009f52] tabular-nums" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 pendek:pt-0.5">
                        <Tombol varian="mint" ukuran="lg" className="pendek:h-10 pendek:text-sm" onClick={resetKeranjang} disabled={keranjang.length === 0}>
                            Reset
                        </Tombol>
                        <Tombol varian="oranye" ukuran="lg" className="pendek:h-10 pendek:text-sm" onClick={handleSimpanDraftPesanan} disabled={keranjang.length === 0}>
                            Simpan
                        </Tombol>
                    </div>

                    <Tombol
                        varian="primary"
                        ukuran="lg"
                        className="kilap-lewat w-full mt-1 pendek:mt-0.5 h-13 pendek:h-11 text-lg pendek:text-base font-bold"
                        disabled={keranjang.length === 0}
                        onClick={bukaDialogBayar}
                    >
                        Bayar <AngkaBerjalan nilai={grandTotal} format={formatRpBulat} durasi={0.35} className="tabular-nums" />
                    </Tombol>
                </div>
            </aside>

            {createPortal(
                daftarFotoTerbang.map((foto) => (
                    <motion.div
                        key={foto.id}
                        aria-hidden
                        className="fixed z-40 pointer-events-none rounded-full overflow-hidden bg-[#f1f8f4] shadow-kartu-angkat flex items-center justify-center"
                        style={{ left: foto.kiri, top: foto.atas, width: foto.ukuran, height: foto.ukuran }}
                        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                        animate={{
                            x: [0, foto.geserX * 0.45, foto.geserX],
                            y: [0, foto.geserY * 0.45 - 70, foto.geserY],
                            scale: [1, 0.72, 0.14],
                            opacity: [1, 1, 0.4],
                        }}
                        transition={{ duration: 0.6, ease: 'easeInOut', times: [0, 0.45, 1] }}
                        onAnimationComplete={() =>
                            setDaftarFotoTerbang((prev) => prev.filter((x) => x.id !== foto.id))
                        }
                    >
                        {foto.fotoUrl ? (
                            <img src={foto.fotoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl">🥬</span>
                        )}
                    </motion.div>
                )),
                document.body
            )}

            {/* Salinan cetak langsung di bawah body: tak terpengaruh tata letak dan animasi dialog */}
            {dialogNota.struk && createPortal(<StrukNota id="area-cetak-nota" data={dialogNota.struk} />, document.body)}

            {/* MODAL PEMBAYARAN KASIR */}
            <Dialog
                terbuka={dialogBayar}
                padaTutup={() => setDialogBayar(false)}
                judul="Penyelesaian Pembayaran"
            >
                <form onSubmit={handleProsesBayar} className="space-y-4">
                    <div className="p-4 bg-[#e6f8ef] rounded-2xl flex justify-between items-center">
                        <span className="text-sm font-semibold text-[#007b40]">Total Harus Dibayar</span>
                        <AngkaBerjalan nilai={grandTotal} format={formatRpBulat} durasi={0.35} className="text-2xl font-extrabold text-[#009f52] tabular-nums" />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {metodeBayarList.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMetodeBayarTerpilihId(m.id)}
                                    className={`h-12 px-4 rounded-xl border-2 text-sm font-semibold flex items-center justify-between transition-[background-color,border-color,color,scale,box-shadow] duration-200 ${
                                        metodeBayarTerpilihId === m.id
                                            ? 'border-[#5fd39a] bg-[#eefaf3] text-[#007b40]'
                                            : 'border-[#edf2ef] hover:bg-[#f6f9f7] text-[#14221b]'
                                    }`}
                                >
                                    <span>{m.nama}</span>
                                    <span className="text-[10px] uppercase opacity-60">{m.jenis}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Nominal Uang Diterima (Rp)
                        </label>
                        <Input
                            type="number"
                            min={grandTotal.toString()}
                            value={inputUangDiterimaRp}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputUangDiterimaRp(e.target.value)}
                            required
                        />
                        {/* Tombol Pecahan Cepat */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            <button
                                type="button"
                                onClick={() => setInputUangDiterimaRp(grandTotal.toString())}
                                className="px-3 h-8 text-xs font-semibold rounded-full bg-[#f1f4f2] hover:bg-[#e6f8ef] hover:text-[#007b40] text-[#14221b] transition-colors"
                            >
                                Uang Pas
                            </button>
                            {[20000, 50000, 100000, 200000].map((nominal) => (
                                nominal >= grandTotal && (
                                    <button
                                        key={nominal}
                                        type="button"
                                        onClick={() => setInputUangDiterimaRp(nominal.toString())}
                                        className="px-3 h-8 text-xs font-semibold rounded-full bg-[#f1f4f2] hover:bg-[#e6f8ef] hover:text-[#007b40] text-[#14221b] transition-colors"
                                    >
                                        {formatRp(nominal)}
                                    </button>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Tampilan Kembalian */}
                    {parseFloat(inputUangDiterimaRp || '0') >= grandTotal && (
                        <div className="p-3 bg-[#f6f9f7] rounded-xl flex justify-between items-center animate-muncul-naik">
                            <span className="text-xs font-medium text-[#5f756b]">Kembalian</span>
                            <AngkaBerjalan
                                nilai={parseFloat(inputUangDiterimaRp) - grandTotal}
                                format={formatRpBulat}
                                durasi={0.3}
                                className="text-base font-bold text-[#14221b] tabular-nums"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            No. Referensi / Batch EDC (Opsional)
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: REF-123984 / QRIS REF"
                            value={inputRefEksternal}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputRefEksternal(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Tombol varian="secondary" onClick={() => setDialogBayar(false)}>
                            Batal
                        </Tombol>
                        <Tombol varian="primary" type="submit" memuat={sedangSubmit}>
                            Konfirmasi & Selesaikan
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* MODAL BUKA SHIFT */}
            <Dialog
                terbuka={dialogBukaShift}
                padaTutup={() => setDialogBukaShift(false)}
                judul="Buka Shift Kasir Baru"
            >
                <form onSubmit={handleBukaShift} className="space-y-4">
                    <p className="text-xs text-[#5f756b]">
                        Masukkan saldo kas awal di laci uang untuk memulai operasional kasir cabang.
                    </p>
                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Modal Awal Laci (Rp)
                        </label>
                        <Input
                            type="number"
                            min="0"
                            value={inputModalAwal}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputModalAwal(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Tombol varian="secondary" onClick={() => setDialogBukaShift(false)}>
                            Batal
                        </Tombol>
                        <Tombol varian="primary" type="submit" memuat={sedangSubmit}>
                            Buka Shift Sekarang
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* MODAL TUTUP SHIFT & REKONSILIASI */}
            <Dialog
                terbuka={dialogTutupShift}
                padaTutup={() => setDialogTutupShift(false)}
                judul="Tutup Shift & Rekonsiliasi Kasir"
            >
                <form onSubmit={handleTutupShift} className="space-y-4">
                    {shiftAktif && (
                        <div className="p-3 bg-[#f6f9f7] rounded-xl space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-[#5f756b]">Modal Awal</span>
                                <span className="font-semibold">{formatRp(shiftAktif.modal_awal_rp)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#5f756b]">Saldo Kas Seharusnya (Sistem)</span>
                                <span className="font-bold text-[#009f52]">{formatRp(shiftAktif.saldo_sistem_rp)}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Saldo Kas Fisik Hasil Hitung Laci (Rp)
                        </label>
                        <Input
                            type="number"
                            min="0"
                            value={inputSaldoFisik}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputSaldoFisik(e.target.value)}
                            required
                        />
                    </div>

                    {shiftAktif && (
                        <div className="p-2.5 rounded-lg border border-[#e3ece7] text-xs flex justify-between font-semibold">
                            <span>Status Selisih:</span>
                            <span className={parseFloat(inputSaldoFisik) - parseFloat(shiftAktif.saldo_sistem_rp) >= 0 ? 'text-[#009f52]' : 'text-red-600'}>
                                {formatRp(parseFloat(inputSaldoFisik) - parseFloat(shiftAktif.saldo_sistem_rp))}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Catatan Rekonsiliasi (Jika Ada Selisih)
                        </label>
                        <Input
                            type="text"
                            placeholder="Alasan selisih kas laci jika ada..."
                            value={inputCatatanSelisih}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputCatatanSelisih(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Tombol varian="secondary" onClick={() => setDialogTutupShift(false)}>
                            Batal
                        </Tombol>
                        <Tombol varian="danger" type="submit" memuat={sedangSubmit}>
                            Tutup & Rekonsiliasi Shift
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* MODAL MUTASI KAS MANUAL */}
            <Dialog
                terbuka={dialogMutasiKas}
                padaTutup={() => setDialogMutasiKas(false)}
                judul="Mutasi Kas Laci (Kas Masuk / Keluar)"
            >
                <form onSubmit={handleSimpanMutasiKas} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Jenis Mutasi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setInputMutasiJenis('kas_masuk_manual')}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                                    inputMutasiJenis === 'kas_masuk_manual'
                                        ? 'border-[#009f52] bg-[#e6f8ef] text-[#007b40]'
                                        : 'border-[#e3ece7] text-[#5f756b]'
                                }`}
                            >
                                <ArrowDownRight className="w-4 h-4 text-[#009f52]" />
                                <span>Kas Masuk</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputMutasiJenis('kas_keluar_manual')}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                                    inputMutasiJenis === 'kas_keluar_manual'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-[#e3ece7] text-[#5f756b]'
                                }`}
                            >
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                                <span>Kas Keluar</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Nominal (Rp)
                        </label>
                        <Input
                            type="number"
                            min="1000"
                            placeholder="Contoh: 50000"
                            value={inputMutasiNominal}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMutasiNominal(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Keterangan Keperluan
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: Beli kantong kresek tambahan / Tambah receh"
                            value={inputMutasiKeterangan}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMutasiKeterangan(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Tombol varian="secondary" onClick={() => setDialogMutasiKas(false)}>
                            Batal
                        </Tombol>
                        <Tombol varian="primary" type="submit" memuat={sedangSubmit}>
                            Simpan Mutasi
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* MODAL INPUT TIMBANGAN SAYUR/BUAH */}
            <Dialog
                terbuka={dialogTimbang.terbuka}
                padaTutup={() => setDialogTimbang({ terbuka: false, produk: null })}
                judul={`Timbang Produk: ${dialogTimbang.produk?.nama || ''}`}
            >
                <div className="space-y-4">
                    <p className="text-xs text-[#5f756b]">
                        Produk ini dijual berdasarkan timbangan berat. Masukkan berat bersih hasil timbangan (dalam kg).
                    </p>
                    <div>
                        <label className="block text-[13px] font-semibold text-[#14221b] mb-1.5">
                            Berat (Kilogram)
                        </label>
                        <Input
                            type="number"
                            step="0.001"
                            min="0.010"
                            value={inputQtyTimbang}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputQtyTimbang(e.target.value)}
                        />
                    </div>
                    {/* Shortcut Tombol Berat Cepat */}
                    <div className="flex flex-wrap gap-1.5">
                        {['0.100', '0.250', '0.500', '1.000', '2.000'].map((berat) => (
                            <button
                                key={berat}
                                type="button"
                                onClick={() => setInputQtyTimbang(berat)}
                                className="px-3 h-8 text-xs font-semibold rounded-full bg-[#f1f4f2] hover:bg-[#e6f8ef] hover:text-[#007b40] text-[#14221b] transition-colors"
                            >
                                {berat} kg
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Tombol varian="secondary" onClick={() => setDialogTimbang({ terbuka: false, produk: null })}>
                            Batal
                        </Tombol>
                        <Tombol
                            varian="primary"
                            onClick={() => {
                                if (dialogTimbang.produk) {
                                    masukkanKeKeranjang(dialogTimbang.produk, inputQtyTimbang);
                                }
                                setDialogTimbang({ terbuka: false, produk: null });
                            }}
                        >
                            Masukkan Keranjang
                        </Tombol>
                    </div>
                </div>
            </Dialog>

            {/* MODAL NOTA STRUK THERMAL 80MM */}
            <Dialog
                terbuka={dialogNota.terbuka}
                padaTutup={() => setDialogNota({ terbuka: false, struk: null })}
                judul="Nota Pembayaran Selesai"
            >
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <motion.svg
                            viewBox="0 0 52 52"
                            className="w-16 h-16"
                            initial={{ scale: 0.4 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                        >
                            <circle cx="26" cy="26" r="25" fill="#e6f8ef" />
                            <motion.path
                                d="M15 27l8 8 15-16"
                                fill="none"
                                stroke="#009f52"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.45, delay: 0.18, ease: KURVA_HALUS }}
                            />
                        </motion.svg>
                    </div>

                    {dialogNota.struk && (
                        <div className="flex justify-center rounded-2xl bg-[#eef3f0] py-4">
                            <div ref={printAreaRef} className="struk-kertas animate-muncul-naik">
                                <StrukNota data={dialogNota.struk} />
                            </div>
                        </div>
                    )}

                    <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-3 flex justify-end gap-2 bg-white border-t border-[#edf2ef]">
                        <Tombol varian="secondary" onClick={() => setDialogNota({ terbuka: false, struk: null })}>
                            Selesai & Transaksi Baru
                        </Tombol>
                        <Tombol varian="primary" ikon={<Printer className="w-4 h-4" />} onClick={handleCetakNota}>
                            Cetak Struk
                        </Tombol>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
