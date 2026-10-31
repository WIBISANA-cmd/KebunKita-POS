import React, { useState, useEffect } from 'react';
import {
    Boxes,
    History,
    AlertOctagon,
    ClipboardCheck,
    RefreshCw,
    Clock,
} from 'lucide-react';
import { Tombol } from '@/komponen/ui/Tombol';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman } from '@/komponen/ui/Paginasi';
import { PEGAS } from '@/komponen/ui/Animasi';
import { motion } from 'motion/react';
import { Input } from '@/komponen/ui/Input';
import { Badge } from '@/komponen/ui/Badge';
import { Dialog } from '@/komponen/ui/Dialog';
import { SkeletonTabel } from '@/komponen/ui/SkeletonTabel';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';
import { formatQty } from '@/util/formatQty';
import { apiClient, ekstrakPesanError } from '@/layanan/apiClient';
import type { LotStok, MutasiStok, LokasiStok, Produk } from '@/tipe';

export interface HalamanStokProps {
    tambahToast: (tipe: 'sukses' | 'error' | 'info', pesan: string) => void;
}

export const HalamanStok: React.FC<HalamanStokProps> = ({ tambahToast }) => {
    const [tabAktif, setTabAktif] = useState<'lot' | 'mutasi'>('lot');
    const [daftarLokasi, setDaftarLokasi] = useState<LokasiStok[]>([]);
    const [daftarProduk, setDaftarProduk] = useState<Produk[]>([]);
    const [pilihanLot, setPilihanLot] = useState<LotStok[]>([]);

    // Hanya tab yang terbuka yang mengambil data
    const lot = useDaftarBerhalaman<LotStok>('/stok/lot', { aktif: tabAktif === 'lot' });
    const mutasi = useDaftarBerhalaman<MutasiStok>('/stok/mutasi', { aktif: tabAktif === 'mutasi' });
    const daftarAktif = tabAktif === 'lot' ? lot : mutasi;
    const daftarLot = lot.data;
    const daftarMutasi = mutasi.data;
    const memuat = daftarAktif.memuat && daftarAktif.data.length === 0;
    const error = daftarAktif.galat;
    const muatData = daftarAktif.muatUlang;

    // Modal Susut
    const [modalSusutBuka, setModalSusutBuka] = useState(false);
    const [susutMemuat, setSusutMemuat] = useState(false);
    const [susutLokasiId, setSusutLokasiId] = useState('');
    const [susutLotId, setSusutLotId] = useState('');
    const [susutQty, setSusutQty] = useState('');
    const [susutAlasan, setSusutAlasan] = useState('Sayur busuk/rusak');

    // Modal Opname
    const [modalOpnameBuka, setModalOpnameBuka] = useState(false);
    const [opnameMemuat, setOpnameMemuat] = useState(false);
    const [opnameLokasiId, setOpnameLokasiId] = useState('');
    const [opnameProdukId, setOpnameProdukId] = useState('');
    const [opnameQtyFisik, setOpnameQtyFisik] = useState('');

    useEffect(() => {
        apiClient
            .get('/lokasi-stok')
            .then((res) => {
                setDaftarLokasi(res.data?.data || []);
                if (res.data?.data?.length > 0) {
                    const lokId = res.data.data[0].id;
                    setSusutLokasiId(lokId);
                    setOpnameLokasiId(lokId);
                }
            })
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, []);

    // Pilihan di dalam dialog baru dimuat saat dialognya dibuka
    useEffect(() => {
        if (!modalSusutBuka) return;
        apiClient
            .get('/stok/lot', { params: { per_halaman: 100 } })
            .then((res) => setPilihanLot(res.data?.data || []))
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, [modalSusutBuka]);

    useEffect(() => {
        if (!modalOpnameBuka || daftarProduk.length > 0) return;
        apiClient
            .get('/produk', { params: { per_halaman: 100 } })
            .then((res) => setDaftarProduk(res.data?.data || []))
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, [modalOpnameBuka]);

    const tanganiSusut = async (e: React.FormEvent) => {
        e.preventDefault();
        setSusutMemuat(true);
        try {
            await apiClient.post('/stok/susut', {
                lokasi_stok_id: susutLokasiId,
                alasan: susutAlasan,
                items: [
                    { lot_stok_id: susutLotId, qty: susutQty },
                ],
            });

            tambahToast('sukses', 'Pencatatan susut sayur berhasil diposting ke ledger stok.');
            setModalSusutBuka(false);
            setSusutQty('');
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setSusutMemuat(false);
        }
    };

    const tanganiOpname = async (e: React.FormEvent) => {
        e.preventDefault();
        setOpnameMemuat(true);
        try {
            await apiClient.post('/stok/opname', {
                lokasi_stok_id: opnameLokasiId,
                items: [
                    { produk_id: opnameProdukId, qty_fisik: opnameQtyFisik },
                ],
            });

            tambahToast('sukses', 'Stock opname berhasil diposting dan saldo stok telah disesuaikan.');
            setModalOpnameBuka(false);
            setOpnameQtyFisik('');
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setOpnameMemuat(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header Kontrol */}
            <Kartu className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-[#14221b]">Persediaan & Mutasi Stok</h2>
                    <p className="text-xs text-[#5f756b]">Pengelolaan persediaan berbasis batch lot FEFO dan ledger stok immutable.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Tombol
                        varian="secondary"
                        ukuran="sm"
                        onClick={muatData}
                        ikon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                        Segarkan
                    </Tombol>

                    <Tombol
                        varian="secondary"
                        ukuran="sm"
                        onClick={() => setModalSusutBuka(true)}
                        ikon={<AlertOctagon className="w-3.5 h-3.5 text-amber-600" />}
                    >
                        Catat Susut / Rusak
                    </Tombol>

                    <Tombol
                        varian="primary"
                        ukuran="sm"
                        onClick={() => setModalOpnameBuka(true)}
                        ikon={<ClipboardCheck className="w-3.5 h-3.5" />}
                    >
                        Stock Opname
                    </Tombol>
                </div>
            </Kartu>

            {/* Tab Navigasi */}
            <Kartu className="flex gap-2 p-2">
                <button
                    onClick={() => setTabAktif('lot')}
                    className={`relative isolate flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        tabAktif === 'lot' ? 'text-white' : 'text-[#14221b] hover:bg-[#e6f8ef]'
                    }`}
                >
                    {tabAktif === 'lot' && (
                        <motion.span layoutId="tab-stok-aktif" transition={PEGAS} className="absolute inset-0 -z-10 rounded-xl bg-[#009f52]" />
                    )}
                    <Boxes className="w-4 h-4" />
                    <span>Daftar Lot Aktif (FEFO)</span>
                </button>

                <button
                    onClick={() => setTabAktif('mutasi')}
                    className={`relative isolate flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        tabAktif === 'mutasi' ? 'text-white' : 'text-[#14221b] hover:bg-[#e6f8ef]'
                    }`}
                >
                    {tabAktif === 'mutasi' && (
                        <motion.span layoutId="tab-stok-aktif" transition={PEGAS} className="absolute inset-0 -z-10 rounded-xl bg-[#009f52]" />
                    )}
                    <History className="w-4 h-4" />
                    <span>Kartu Mutasi Stok Ledger</span>
                </button>
            </Kartu>

            {error && <PesanKesalahan pesan={error} padaUlangi={muatData} />}

            {/* Konten Tab */}
            {memuat ? (
                <Kartu>
                    <SkeletonTabel baris={6} kolom={5} />
                </Kartu>
            ) : tabAktif === 'lot' ? (
                daftarLot.length === 0 ? (
                    <PanelKosong
                        judul="Belum Ada Lot Stok Aktif"
                        deskripsi="Stok bertambah saat penerimaan barang dari pesanan beli (PO) dicatat secara resmi."
                    />
                ) : (
                    <Kartu className="p-0 overflow-hidden">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3">Kode Lot</th>
                                    <th className="px-4 py-3">Lokasi</th>
                                    <th className="px-4 py-3 text-right">Sisa Stok</th>
                                    <th className="px-4 py-3">Kedaluwarsa (FEFO)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef3f0]">
                                {daftarLot.map((lot) => {
                                    const satuan = lot.produk?.satuan_dasar?.kode || 'kg';
                                    const exp = lot.kedaluwarsa_pada
                                        ? new Date(lot.kedaluwarsa_pada).toLocaleDateString('id-ID')
                                        : 'Tanpa Kedaluwarsa';

                                    return (
                                        <tr key={lot.id} className="hover:bg-[#f6f9f7]">
                                            <td className="px-4 py-3 font-semibold text-[#14221b]">
                                                {lot.produk?.nama}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[#5f756b]">
                                                {lot.kode_lot}
                                            </td>
                                            <td className="px-4 py-3 text-[#5f756b]">
                                                {lot.lokasi?.nama || 'Gudang'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-[#009f52]">
                                                {formatQty(lot.qty_sisa, satuan)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge varian={lot.kedaluwarsa_pada ? 'peringatan' : 'netral'}>
                                                    <Clock className="w-3 h-3 mr-1 inline" />
                                                    {exp}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <Paginasi daftar={lot} className="px-4 py-3 border-t border-[#eef3f0]" />
                    </Kartu>
                )
            ) : (
                daftarMutasi.length === 0 ? (
                    <PanelKosong
                        judul="Belum Ada Riwayat Mutasi Stok"
                        deskripsi="Setiap pergerakan barang (penerimaan, penjualan, retur, opname, susut) dicatat immutable di sini."
                    />
                ) : (
                    <Kartu className="p-0 overflow-hidden">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Dokumen</th>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3 text-right">Perubahan (Qty)</th>
                                    <th className="px-4 py-3">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef3f0]">
                                {daftarMutasi.map((m) => {
                                    const satuan = m.produk?.satuan_dasar?.kode || 'kg';
                                    const isPositif = !m.qty_delta.startsWith('-');
                                    const tgl = new Date(m.created_at || m.dibuat_pada || Date.now()).toLocaleString('id-ID');

                                    return (
                                        <tr key={m.id} className="hover:bg-[#f6f9f7]">
                                            <td className="px-4 py-3 text-[#5f756b] whitespace-nowrap">
                                                {tgl}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-[#14221b]">
                                                {m.dokumen?.nomor || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-[#14221b]">
                                                {m.produk?.nama}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${isPositif ? 'text-[#009f52]' : 'text-red-600'}`}>
                                                {isPositif ? `+${formatQty(m.qty_delta, satuan)}` : formatQty(m.qty_delta, satuan)}
                                            </td>
                                            <td className="px-4 py-3 text-[#5f756b]">
                                                {m.keterangan || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <Paginasi daftar={mutasi} className="px-4 py-3 border-t border-[#eef3f0]" />
                    </Kartu>
                )
            )}

            {/* Modal Catat Susut / Rusak */}
            <Dialog
                terbuka={modalSusutBuka}
                padaTutup={() => setModalSusutBuka(false)}
                judul="Pencatatan Susut Sayur (Barang Rusak/Busuk)"
                deskripsi="Kurangi kuantitas stok secara sah dari lot tertentu dengan bukti alasan."
            >
                <form onSubmit={tanganiSusut} className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Pilih Lokasi Stok
                        </label>
                        <select
                            value={susutLokasiId}
                            onChange={(e) => setSusutLokasiId(e.target.value)}
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            {daftarLokasi.map((l) => (
                                <option key={l.id} value={l.id}>{l.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Pilih Lot Sumber
                        </label>
                        <select
                            value={susutLotId}
                            onChange={(e) => setSusutLotId(e.target.value)}
                            required
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            <option value="" disabled>-- Pilih Lot Stok --</option>
                            {pilihanLot.map((pilihan) => (
                                <option key={pilihan.id} value={pilihan.id}>
                                    {pilihan.produk?.nama} ({pilihan.kode_lot}) - Sisa: {pilihan.qty_sisa}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Kuantitas Susut (kg / satuan)"
                        type="number"
                        step="0.001"
                        required
                        placeholder="Contoh: 0.500"
                        value={susutQty}
                        onChange={(e) => setSusutQty(e.target.value)}
                    />

                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Alasan Susut
                        </label>
                        <select
                            value={susutAlasan}
                            onChange={(e) => setSusutAlasan(e.target.value)}
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            <option value="Sayur busuk/rusak">Sayur busuk / layu</option>
                            <option value="Rusak saat bongkar muat">Rusak saat transportasi / bongkar muat</option>
                            <option value="Kedaluwarsa">Melewati batas simpan segar</option>
                            <option value="Penyusutan alami">Penyusutan kadar air alami</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#e3ece7]">
                        <Tombol
                            type="button"
                            varian="secondary"
                            ukuran="md"
                            onClick={() => setModalSusutBuka(false)}
                        >
                            Batal
                        </Tombol>
                        <Tombol
                            type="submit"
                            varian="danger"
                            ukuran="md"
                            memuat={susutMemuat}
                        >
                            Posting Susut
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* Modal Stock Opname */}
            <Dialog
                terbuka={modalOpnameBuka}
                padaTutup={() => setModalOpnameBuka(false)}
                judul="Stock Opname Fisik"
                deskripsi="Bandingkan hitungan fisik sayur dengan data saldo sistem dan posting penyesuaian."
            >
                <form onSubmit={tanganiOpname} className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Lokasi Hitung
                        </label>
                        <select
                            value={opnameLokasiId}
                            onChange={(e) => setOpnameLokasiId(e.target.value)}
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            {daftarLokasi.map((l) => (
                                <option key={l.id} value={l.id}>{l.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Pilih Produk
                        </label>
                        <select
                            value={opnameProdukId}
                            onChange={(e) => setOpnameProdukId(e.target.value)}
                            required
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            <option value="" disabled>-- Pilih Produk --</option>
                            {daftarProduk.map((p) => (
                                <option key={p.id} value={p.id}>{p.nama} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Hasil Hitung Fisik Sebenarnya (Satuan Dasar)"
                        type="number"
                        step="0.001"
                        required
                        placeholder="Contoh: 14.250"
                        value={opnameQtyFisik}
                        onChange={(e) => setOpnameQtyFisik(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#e3ece7]">
                        <Tombol
                            type="button"
                            varian="secondary"
                            ukuran="md"
                            onClick={() => setModalOpnameBuka(false)}
                        >
                            Batal
                        </Tombol>
                        <Tombol
                            type="submit"
                            varian="primary"
                            ukuran="md"
                            memuat={opnameMemuat}
                        >
                            Posting Opname
                        </Tombol>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};
