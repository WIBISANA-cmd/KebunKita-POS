import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Plus 
} from 'lucide-react';
import { apiClient } from '@/layanan/apiClient';
import { 
    type ReturJual, 
    type Penjualan, 
    type MetodeBayar 
} from '@/tipe';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman, useNilaiTertunda } from '@/komponen/ui/Paginasi';
import { Tombol } from '@/komponen/ui/Tombol';
import { Input } from '@/komponen/ui/Input';
import { Badge } from '@/komponen/ui/Badge';
import { Dialog } from '@/komponen/ui/Dialog';
import { SkeletonTabel } from '@/komponen/ui/SkeletonTabel';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';

interface ItemReturForm {
    item_jual_id: string;
    nama: string;
    qty_max: string;
    qty_retur: string;
    harga_satuan_rp: string;
    layak_jual: boolean;
    keterangan_kondisi: string;
}

export function HalamanRetur({
    tambahToast,
}: {
    tambahToast: (tipe: 'sukses' | 'error' | 'info', pesan: string) => void;
}) {
    const [kataKunciCari, setKataKunciCari] = useState('');

    // Pencarian dijalankan server supaya mencakup seluruh riwayat, bukan satu halaman saja
    const cariTertunda = useNilaiTertunda(kataKunciCari.trim());
    const riwayat = useDaftarBerhalaman<ReturJual>('/retur-jual', {
        filter: { cari: cariTertunda },
        perHalaman: 15,
    });
    const daftarRetur = riwayat.data;
    const sedangMemuat = riwayat.memuat && daftarRetur.length === 0;
    const pesanError = riwayat.galat;
    const muatDaftarRetur = riwayat.muatUlang;

    // Modal Form Retur
    const [dialogBuka, setDialogBuka] = useState(false);
    const [sedangCariInvoice, setSedangCariInvoice] = useState(false);
    const [inputNoInvoice, setInputNoInvoice] = useState('');
    const [invoiceDitemukan, setInvoiceDitemukan] = useState<Penjualan | null>(null);
    const [itemsRetur, setItemsRetur] = useState<ItemReturForm[]>([]);
    const [alasanRetur, setAlasanRetur] = useState('Sayur layu / kemasan rusak');
    const [metodeBayarList, setMetodeBayarList] = useState<MetodeBayar[]>([]);
    const [metodeRefundTerpilih, setMetodeRefundTerpilih] = useState('');
    const [sedangSubmit, setSedangSubmit] = useState(false);

    useEffect(() => {
        muatMetodeBayar();
    }, []);

    const muatMetodeBayar = async () => {
        try {
            const res = await apiClient.get('/metode-bayar');
            const data = res.data.data || [];
            setMetodeBayarList(data);
            if (data.length > 0) {
                setMetodeRefundTerpilih(data[0].id);
            }
        } catch (err) {
            // Abaikan
        }
    };

    const cariInvoicePenjualan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputNoInvoice.trim()) return;

        setSedangCariInvoice(true);
        setInvoiceDitemukan(null);
        setItemsRetur([]);
        try {
            const res = await apiClient.get(`/penjualan?cari=${encodeURIComponent(inputNoInvoice.trim())}`);
            const list: Penjualan[] = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.data || []);
            const pas = list.find((p) => p.nomor.toLowerCase() === inputNoInvoice.trim().toLowerCase()) || list[0];

            if (!pas) {
                tambahToast('error', `Invoice penjualan "${inputNoInvoice}" tidak ditemukan.`);
                return;
            }

            // Ambil detail lengkap invoice
            const resDetail = await apiClient.get(`/penjualan/${pas.id}`);
            const penjualanLengkap: Penjualan = resDetail.data.data;
            setInvoiceDitemukan(penjualanLengkap);

            // Inisialisasi item retur
            const itemsInisial: ItemReturForm[] = (penjualanLengkap.items || []).map((it) => ({
                item_jual_id: it.id,
                nama: it.nama_snapshot,
                qty_max: it.qty,
                qty_retur: '0',
                harga_satuan_rp: it.harga_snapshot_rp,
                layak_jual: true,
                keterangan_kondisi: '',
            }));
            setItemsRetur(itemsInisial);
        } catch (err: any) {
            tambahToast('error', err.response?.data?.pesan || 'Gagal mencari nota penjualan.');
        } finally {
            setSedangCariInvoice(false);
        }
    };

    const hitungTotalRefund = () => {
        return itemsRetur.reduce((sum, it) => {
            const qty = parseFloat(it.qty_retur) || 0;
            const harga = parseFloat(it.harga_satuan_rp) || 0;
            return sum + (qty * harga);
        }, 0);
    };

    const handleKirimRetur = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceDitemukan) return;

        const itemsDipilih = itemsRetur.filter((it) => parseFloat(it.qty_retur) > 0);
        if (itemsDipilih.length === 0) {
            tambahToast('error', 'Masukkan kuantitas retur minimal untuk satu item.');
            return;
        }

        const totalRefundRp = Math.round(hitungTotalRefund()).toString();

        setSedangSubmit(true);
        try {
            await apiClient.post('/retur-jual', {
                penjualan_id: invoiceDitemukan.id,
                alasan: alasanRetur,
                items: itemsDipilih.map((it) => ({
                    item_jual_id: it.item_jual_id,
                    qty: it.qty_retur,
                    layak_jual: it.layak_jual,
                    keterangan_kondisi: it.keterangan_kondisi || null,
                })),
                refunds: [
                    {
                        metode_bayar_id: metodeRefundTerpilih,
                        nilai_rp: totalRefundRp,
                    },
                ],
            });

            tambahToast('sukses', 'Retur penjualan berhasil diproses dan dana telah direfund.');
            setDialogBuka(false);
            setInvoiceDitemukan(null);
            setInputNoInvoice('');
            setItemsRetur([]);
            muatDaftarRetur();
        } catch (err: any) {
            tambahToast('error', err.response?.data?.pesan || 'Gagal memproses retur.');
        } finally {
            setSedangSubmit(false);
        }
    };

    const formatRp = (angka: number | string) => {
        const val = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    return (
        <div className="space-y-3">
            {/* HEADER */}
            <Kartu className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-[#14221b]">Retur Penjualan & Pengembalian Dana</h2>
                    <p className="text-xs text-[#5f756b]">
                        Kelola pengembalian barang pelanggan, pemilahan stok layak jual vs rusak, serta refund kasir.
                    </p>
                </div>
                <Tombol 
                    varian="primary" 
                    ikon={<Plus className="w-4 h-4 mr-1.5" />}
                    onClick={() => {
                        setInvoiceDitemukan(null);
                        setInputNoInvoice('');
                        setItemsRetur([]);
                        setDialogBuka(true);
                    }}
                >
                    Proses Retur Baru
                </Tombol>
            </Kartu>

            {/* BAR PENCARIAN */}
            <Kartu className="flex items-center gap-3 p-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f756b]" />
                    <input
                        type="text"
                        placeholder="Cari no. retur atau no. nota penjualan..."
                        value={kataKunciCari}
                        onChange={(e) => setKataKunciCari(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#e3ece7] text-xs text-[#14221b] focus:outline-none focus:border-[#009f52]"
                    />
                </div>
            </Kartu>

            {/* TABEL DAFTAR RETUR */}
            <Kartu className="overflow-hidden p-0">
                {pesanError && <div className="p-4"><PesanKesalahan pesan={pesanError} /></div>}

                {sedangMemuat ? (
                    <div className="p-4">
                        <SkeletonTabel baris={5} kolom={6} />
                    </div>
                ) : daftarRetur.length === 0 ? (
                    <div className="p-8">
                        <PanelKosong
                            judul="Belum Ada Transaksi Retur"
                            deskripsi={kataKunciCari ? `Tidak ditemukan data retur untuk "${kataKunciCari}".` : 'Seluruh penjualan berjalan baik tanpa retur.'}
                        />
                    </div>
                ) : (
                    <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px] text-[#14221b]">
                            <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                                <tr>
                                    <th className="px-4 py-3">No. Retur</th>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">No. Nota Penjualan</th>
                                    <th className="px-4 py-3">Alasan Retur</th>
                                    <th className="px-4 py-3 text-right">Total Refund</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef3f0]">
                                {daftarRetur.map((retur) => (
                                    <tr key={retur.id} className="hover:bg-[#f6f9f7]/60 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-[#007b40]">
                                            {retur.nomor}
                                        </td>
                                        <td className="px-4 py-3 text-[#5f756b]">
                                            {new Date(retur.waktu_retur).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {retur.penjualan?.nomor || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-[#5f756b] max-w-xs truncate">
                                            {retur.alasan}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">
                                            {formatRp(retur.total_refund_rp)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge varian={retur.status === 'selesai' ? 'sukses' : 'peringatan'}>
                                                {retur.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginasi daftar={riwayat} className="px-4 py-3 border-t border-[#eef3f0]" />
                    </>
                )}
            </Kartu>

            {/* MODAL PROSES RETUR BARU */}
            <Dialog
                terbuka={dialogBuka}
                padaTutup={() => setDialogBuka(false)}
                judul="Proses Retur Penjualan & Refund"
            >
                <div className="space-y-4">
                    {/* TAHAP 1: CARI NOTA PENJUALAN */}
                    <form onSubmit={cariInvoicePenjualan} className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Ketik No. Nota Penjualan (Contoh: PJ-...)"
                            value={inputNoInvoice}
                            onChange={(e) => setInputNoInvoice(e.target.value)}
                            required
                        />
                        <Tombol varian="secondary" type="submit" memuat={sedangCariInvoice}>
                            Cari Nota
                        </Tombol>
                    </form>

                    {invoiceDitemukan && (
                        <form onSubmit={handleKirimRetur} className="space-y-4 pt-2 border-t border-[#e3ece7]">
                            <div className="p-3 bg-[#e6f8ef] rounded-xl border border-[#c3eed7] text-xs space-y-1">
                                <div className="flex justify-between font-semibold text-[#007b40]">
                                    <span>Nota: {invoiceDitemukan.nomor}</span>
                                    <span>Total Asal: {formatRp(invoiceDitemukan.total_rp)}</span>
                                </div>
                                <div className="text-[11px] text-[#5f756b]">
                                    Waktu: {new Date(invoiceDitemukan.waktu_penjualan).toLocaleString('id-ID')}
                                </div>
                            </div>

                            {/* ITEM PICKER & PILIH KONDISI */}
                            <div>
                                <label className="block text-xs font-semibold text-[#14221b] mb-1.5">
                                    Pilih Item & Kuantitas Retur
                                </label>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {itemsRetur.map((item, idx) => (
                                        <div 
                                            key={item.item_jual_id}
                                            className="p-2.5 rounded-xl border border-[#e3ece7] bg-[#f6f9f7] space-y-2 text-xs"
                                        >
                                            <div className="flex justify-between items-center font-medium">
                                                <span>{item.nama}</span>
                                                <span className="text-[#5f756b]">
                                                    {formatRp(item.harga_satuan_rp)} (Beli: {item.qty_max})
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-[#5f756b] block">Qty Diretur:</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        max={item.qty_max}
                                                        value={item.qty_retur}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setItemsRetur((prev) => {
                                                                const update = [...prev];
                                                                update[idx] = { ...update[idx], qty_retur: val };
                                                                return update;
                                                            });
                                                        }}
                                                        className="w-full px-2 py-1 bg-white rounded border border-[#e3ece7] text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-[#5f756b] block">Kondisi Barang:</label>
                                                    <select
                                                        value={item.layak_jual ? 'layak' : 'rusak'}
                                                        onChange={(e) => {
                                                            const layak = e.target.value === 'layak';
                                                            setItemsRetur((prev) => {
                                                                const update = [...prev];
                                                                update[idx] = { ...update[idx], layak_jual: layak };
                                                                return update;
                                                            });
                                                        }}
                                                        className="w-full px-2 py-1 bg-white rounded border border-[#e3ece7] text-xs font-medium"
                                                    >
                                                        <option value="layak">Layak Jual (Kembali ke Stok)</option>
                                                        <option value="rusak">Rusak / Busuk (Masuk Susut)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ALASAN RETUR */}
                            <div>
                                <label className="block text-xs font-semibold text-[#14221b] mb-1">
                                    Alasan Retur
                                </label>
                                <Input
                                    type="text"
                                    value={alasanRetur}
                                    onChange={(e) => setAlasanRetur(e.target.value)}
                                    required
                                />
                            </div>

                            {/* METODE PENGEMBALIAN DANA (REFUND) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#14221b] mb-1">
                                    Metode Pengembalian Dana
                                </label>
                                <select
                                    value={metodeRefundTerpilih}
                                    onChange={(e) => setMetodeRefundTerpilih(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#e3ece7] text-xs text-[#14221b] focus:outline-none focus:border-[#009f52]"
                                >
                                    {metodeBayarList.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.nama} ({m.jenis})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* TOTAL REFUND */}
                            <div className="p-3 bg-[#f6f9f7] rounded-xl border border-[#e3ece7] flex justify-between items-center text-xs">
                                <span className="font-semibold text-[#5f756b]">Total Dana yang Direfund</span>
                                <span className="text-base font-bold text-red-600">
                                    {formatRp(hitungTotalRefund())}
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Tombol varian="secondary" onClick={() => setDialogBuka(false)}>
                                    Batal
                                </Tombol>
                                <Tombol varian="danger" type="submit" memuat={sedangSubmit}>
                                    Konfirmasi & Refund Dana
                                </Tombol>
                            </div>
                        </form>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
