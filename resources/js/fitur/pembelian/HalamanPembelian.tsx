import React, { useState, useEffect } from 'react';
import {
    Plus,
    RefreshCw,
    CheckCircle2,
    PackageCheck,
    DollarSign,
} from 'lucide-react';
import { Tombol } from '@/komponen/ui/Tombol';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman } from '@/komponen/ui/Paginasi';
import { Input } from '@/komponen/ui/Input';
import { Badge } from '@/komponen/ui/Badge';
import { Dialog } from '@/komponen/ui/Dialog';
import { SkeletonTabel } from '@/komponen/ui/SkeletonTabel';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';
import { formatRupiah } from '@/util/formatRupiah';
import { apiClient, ekstrakPesanError } from '@/layanan/apiClient';
import type { PesananBeli, Pemasok, Produk, LokasiStok } from '@/tipe';

export interface HalamanPembelianProps {
    tambahToast: (tipe: 'sukses' | 'error' | 'info', pesan: string) => void;
}

export const HalamanPembelian: React.FC<HalamanPembelianProps> = ({ tambahToast }) => {
    const [daftarPemasok, setDaftarPemasok] = useState<Pemasok[]>([]);
    const [daftarProduk, setDaftarProduk] = useState<Produk[]>([]);
    const [daftarLokasi, setDaftarLokasi] = useState<LokasiStok[]>([]);

    const pesanan = useDaftarBerhalaman<PesananBeli>('/pembelian', { perHalaman: 15 });
    const daftarPO = pesanan.data;
    const memuat = pesanan.memuat && daftarPO.length === 0;
    const error = pesanan.galat;
    const muatData = pesanan.muatUlang;

    // Modal Buat PO
    const [modalPOBuka, setModalPOBuka] = useState(false);
    const [simpanPOMemuat, setSimpanPOMemuat] = useState(false);
    const [pemasokId, setPemasokId] = useState('');
    const [catatanPO, setCatatanPO] = useState('');
    const [itemSatuanProdukId, setItemSatuanProdukId] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemHarga, setItemHarga] = useState('');

    // Modal Terima Barang
    const [modalTerimaBuka, setModalTerimaBuka] = useState(false);
    const [terimaMemuat, setTerimaMemuat] = useState(false);
    const [poDipilih, setPoDipilih] = useState<PesananBeli | null>(null);
    const [lokasiTerimaId, setLokasiTerimaId] = useState('');
    const [qtyTerimaInput, setQtyTerimaInput] = useState<Record<string, string>>({});
    const [expTerimaInput, setExpTerimaInput] = useState<Record<string, string>>({});

    useEffect(() => {
        Promise.all([apiClient.get('/pemasok'), apiClient.get('/lokasi-stok')])
            .then(([resPem, resLok]) => {
                setDaftarPemasok(resPem.data?.data || []);
                setDaftarLokasi(resLok.data?.data || []);

                if (resPem.data?.data?.length > 0) setPemasokId(resPem.data.data[0].id);
                if (resLok.data?.data?.length > 0) setLokasiTerimaId(resLok.data.data[0].id);
            })
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, []);

    // Daftar produk hanya dibutuhkan dialog Buat PO
    useEffect(() => {
        if (!modalPOBuka || daftarProduk.length > 0) return;
        apiClient
            .get('/produk', { params: { per_halaman: 100 } })
            .then((res) => setDaftarProduk(res.data?.data || []))
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, [modalPOBuka]);

    const tanganiBuatPO = async (e: React.FormEvent) => {
        e.preventDefault();
        setSimpanPOMemuat(true);
        try {
            await apiClient.post('/pembelian', {
                pemasok_id: pemasokId,
                catatan: catatanPO || null,
                items: [
                    {
                        satuan_produk_id: itemSatuanProdukId,
                        qty: itemQty,
                        harga_rp: itemHarga,
                    },
                ],
            });

            tambahToast('sukses', 'Pesanan beli (PO) berhasil dibuat.');
            setModalPOBuka(false);
            setItemQty('');
            setItemHarga('');
            setCatatanPO('');
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setSimpanPOMemuat(false);
        }
    };

    const tanganiSetujuiPO = async (po: PesananBeli) => {
        try {
            await apiClient.post(`/pembelian/${po.id}/setujui`);
            tambahToast('sukses', `PO ${po.nomor} telah disetujui.`);
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        }
    };

    const bukaModalTerima = (po: PesananBeli) => {
        setPoDipilih(po);
        const initQty: Record<string, string> = {};
        const initExp: Record<string, string> = {};
        po.items?.forEach((it) => {
            const sisa = (parseFloat(it.qty) - parseFloat(it.qty_diterima || '0')).toString();
            initQty[it.id] = sisa > '0' ? sisa : '0';
        });
        setQtyTerimaInput(initQty);
        setExpTerimaInput(initExp);
        setModalTerimaBuka(true);
    };

    const tanganiTerimaBarang = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!poDipilih) return;

        setTerimaMemuat(true);
        try {
            const items = poDipilih.items?.map((it) => ({
                item_beli_id: it.id,
                qty_diterima: qtyTerimaInput[it.id] || '0',
                kedaluwarsa_pada: expTerimaInput[it.id] || null,
            })).filter((x) => parseFloat(x.qty_diterima) > 0);

            if (!items || items.length === 0) {
                tambahToast('error', 'Masukkan jumlah diterima lebih besar dari 0.');
                setTerimaMemuat(false);
                return;
            }

            await apiClient.post(`/pembelian/${poDipilih.id}/penerimaan`, {
                lokasi_stok_id: lokasiTerimaId,
                items,
            });

            tambahToast('sukses', 'Penerimaan barang berhasil diposting dan lot FEFO telah dibuat.');
            setModalTerimaBuka(false);
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setTerimaMemuat(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header Kontrol */}
            <Kartu className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-[#14221b]">Pembelian & Pesanan Pemasok (PO)</h2>
                    <p className="text-xs text-[#5f756b]">Pemesanan sayur ke supplier dan penerimaan barang fisik bertahap.</p>
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
                        varian="primary"
                        ukuran="sm"
                        onClick={() => setModalPOBuka(true)}
                        ikon={<Plus className="w-3.5 h-3.5" />}
                    >
                        Buat PO Baru
                    </Tombol>
                </div>
            </Kartu>

            {error && <PesanKesalahan pesan={error} padaUlangi={muatData} />}

            {/* Tabel PO */}
            {memuat ? (
                <Kartu>
                    <SkeletonTabel baris={6} kolom={6} />
                </Kartu>
            ) : daftarPO.length === 0 ? (
                <PanelKosong
                    judul="Belum Ada Pesanan Beli (PO)"
                    deskripsi="Buat pesanan beli baru ke pemasok sayur untuk memulai pengadaan stok toko."
                    labelAksi="Buat Pesanan Pertama"
                    padaKlikAksi={() => setModalPOBuka(true)}
                />
            ) : (
                <Kartu className="p-0 overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                            <tr>
                                <th className="px-4 py-3">Nomor PO</th>
                                <th className="px-4 py-3">Pemasok</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3 text-right">Nilai Total</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Aksi Operasional</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3f0]">
                            {daftarPO.map((po) => {
                                const tgl = new Date(po.dibuat_pada).toLocaleDateString('id-ID');
                                return (
                                    <tr key={po.id} className="hover:bg-[#f6f9f7]">
                                        <td className="px-4 py-3 font-mono font-bold text-[#14221b]">
                                            {po.nomor}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-[#14221b]">
                                            {po.pemasok?.nama || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-[#5f756b]">
                                            {tgl}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-[#009f52]">
                                            {formatRupiah(po.total_rp)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                varian={
                                                    po.status === 'diterima_penuh'
                                                        ? 'sukses'
                                                        : po.status === 'disetujui' || po.status === 'diterima_sebagian'
                                                        ? 'peringatan'
                                                        : 'netral'
                                                }
                                            >
                                                {po.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {po.status === 'draft' && (
                                                    <button
                                                        onClick={() => tanganiSetujuiPO(po)}
                                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#007b40] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Setujui</span>
                                                    </button>
                                                )}

                                                {(po.status === 'disetujui' || po.status === 'diterima_sebagian') && (
                                                    <button
                                                        onClick={() => bukaModalTerima(po)}
                                                        className="px-2.5 py-1 bg-[#009f52] hover:bg-[#007b40] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                                                    >
                                                        <PackageCheck className="w-3.5 h-3.5" />
                                                        <span>Terima Barang</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <Paginasi daftar={pesanan} className="px-4 py-3 border-t border-[#eef3f0]" />
                </Kartu>
            )}

            {/* Modal Buat PO Baru */}
            <Dialog
                terbuka={modalPOBuka}
                padaTutup={() => setModalPOBuka(false)}
                judul="Buat Pesanan Beli (PO) Baru"
                deskripsi="Kirim order pengadaan sayur kepada pemasok terdaftar."
            >
                <form onSubmit={tanganiBuatPO} className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Pemasok / Supplier
                        </label>
                        <select
                            value={pemasokId}
                            onChange={(e) => setPemasokId(e.target.value)}
                            required
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            {daftarPemasok.map((p) => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Pilih Produk & Satuan
                        </label>
                        <select
                            value={itemSatuanProdukId}
                            onChange={(e) => setItemSatuanProdukId(e.target.value)}
                            required
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            <option value="" disabled>-- Pilih Produk Sayur --</option>
                            {daftarProduk.map((p) => (
                                p.satuan_produk?.map((sp) => (
                                    <option key={sp.id} value={sp.id}>
                                        {p.nama} ({sp.satuan?.kode || 'kg'})
                                    </option>
                                ))
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Jumlah Dipesan"
                            type="number"
                            step="0.001"
                            required
                            placeholder="Contoh: 10.0"
                            value={itemQty}
                            onChange={(e) => setItemQty(e.target.value)}
                        />

                        <Input
                            label="Harga Beli Satuan (Rp)"
                            type="number"
                            required
                            placeholder="Contoh: 12000"
                            value={itemHarga}
                            onChange={(e) => setItemHarga(e.target.value)}
                            ikonKiri={<DollarSign className="w-4 h-4" />}
                        />
                    </div>

                    <Input
                        label="Catatan Tambahan"
                        placeholder="Contoh: Pengiriman pagi sebelum jam 7"
                        value={catatanPO}
                        onChange={(e) => setCatatanPO(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#e3ece7]">
                        <Tombol
                            type="button"
                            varian="secondary"
                            ukuran="md"
                            onClick={() => setModalPOBuka(false)}
                        >
                            Batal
                        </Tombol>
                        <Tombol
                            type="submit"
                            varian="primary"
                            ukuran="md"
                            memuat={simpanPOMemuat}
                        >
                            Simpan PO
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* Modal Penerimaan Barang */}
            <Dialog
                terbuka={modalTerimaBuka}
                padaTutup={() => setModalTerimaBuka(false)}
                judul={`Penerimaan Barang Fisik: PO ${poDipilih?.nomor}`}
                deskripsi="Catat jumlah barang yang tiba secara riil dan tentukan masa kedaluwarsa untuk batch lot FEFO."
                lebarMaks="max-w-lg"
            >
                <form onSubmit={tanganiTerimaBarang} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Simpan di Lokasi Stok
                        </label>
                        <select
                            value={lokasiTerimaId}
                            onChange={(e) => setLokasiTerimaId(e.target.value)}
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2"
                        >
                            {daftarLokasi.map((l) => (
                                <option key={l.id} value={l.id}>{l.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3 border-t border-b border-[#e3ece7] py-3">
                        <h4 className="text-xs font-bold text-[#14221b]">Rincian Barang yang Tiba:</h4>
                        {poDipilih?.items?.map((it) => {
                            const sisa = (parseFloat(it.qty) - parseFloat(it.qty_diterima || '0')).toString();
                            return (
                                <div key={it.id} className="p-3 bg-[#f6f9f7] rounded-xl border border-[#e3ece7] space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-[#14221b]">{it.produk?.nama}</span>
                                        <span className="text-[#5f756b]">Sisa Belum Diterima: {sisa}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            label="Qty Diterima Hari Ini"
                                            type="number"
                                            step="0.001"
                                            value={qtyTerimaInput[it.id] || ''}
                                            onChange={(e) => setQtyTerimaInput({ ...qtyTerimaInput, [it.id]: e.target.value })}
                                            placeholder="0"
                                        />
                                        <Input
                                            label="Tanggal Kedaluwarsa (Opsional)"
                                            type="date"
                                            value={expTerimaInput[it.id] || ''}
                                            onChange={(e) => setExpTerimaInput({ ...expTerimaInput, [it.id]: e.target.value })}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Tombol
                            type="button"
                            varian="secondary"
                            ukuran="md"
                            onClick={() => setModalTerimaBuka(false)}
                        >
                            Batal
                        </Tombol>
                        <Tombol
                            type="submit"
                            varian="primary"
                            ukuran="md"
                            memuat={terimaMemuat}
                        >
                            Posting Penerimaan Stok
                        </Tombol>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};
