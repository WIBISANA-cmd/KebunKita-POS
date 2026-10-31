import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    Edit3,
    Archive,
    Grid,
    List,
    DollarSign,
} from 'lucide-react';
import { Tombol } from '@/komponen/ui/Tombol';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman, useNilaiTertunda } from '@/komponen/ui/Paginasi';
import { usePopup } from '@/komponen/ui/PopupAlert';
import { Input } from '@/komponen/ui/Input';
import { Badge } from '@/komponen/ui/Badge';
import { Dialog } from '@/komponen/ui/Dialog';
import { SkeletonProduk } from '@/komponen/ui/SkeletonProduk';
import { SkeletonTabel } from '@/komponen/ui/SkeletonTabel';
import { PanelKosong } from '@/komponen/ui/PanelKosong';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';
import { formatRupiah } from '@/util/formatRupiah';
import { apiClient, ekstrakPesanError } from '@/layanan/apiClient';
import type { Produk, KategoriProduk, Satuan } from '@/tipe';

export interface HalamanProdukProps {
    tambahToast: (tipe: 'sukses' | 'error' | 'info', pesan: string) => void;
}

export const HalamanProduk: React.FC<HalamanProdukProps> = ({ tambahToast }) => {
    const { konfirmasi } = usePopup();
    const [daftarKategori, setDaftarKategori] = useState<KategoriProduk[]>([]);
    const [daftarSatuan, setDaftarSatuan] = useState<Satuan[]>([]);
    const [kategoriTerpilih, setKategoriTerpilih] = useState<string>('all');
    const [cari, setCari] = useState<string>('');
    const [modeTampilan, setModeTampilan] = useState<'grid' | 'tabel'>('grid');

    const cariTertunda = useNilaiTertunda(cari.trim());
    const katalog = useDaftarBerhalaman<Produk>('/produk', {
        filter: {
            kategori_id: kategoriTerpilih === 'all' ? undefined : kategoriTerpilih,
            q: cariTertunda,
        },
        perHalaman: 20,
    });
    const daftarProduk = katalog.data;
    const memuat = katalog.memuat && daftarProduk.length === 0;
    const error = katalog.galat;
    const muatData = katalog.muatUlang;

    // Modal Form State
    const [modalBuka, setModalBuka] = useState(false);
    const [simpanMemuat, setSimpanMemuat] = useState(false);
    const [sku, setSku] = useState('');
    const [nama, setNama] = useState('');
    const [kategoriId, setKategoriId] = useState('');
    const [satuanDasarId, setSatuanDasarId] = useState('');
    const [tipeJual, setTipeJual] = useState<'timbang' | 'satuan'>('timbang');
    const [hargaRp, setHargaRp] = useState('');
    const [stokMin, setStokMin] = useState('0');
    const [deskripsi, setDeskripsi] = useState('');

    // Modal Edit State
    const [produkEdit, setProdukEdit] = useState<Produk | null>(null);
    const [modalEditBuka, setModalEditBuka] = useState(false);
    const [editMemuat, setEditMemuat] = useState(false);
    const [editNama, setEditNama] = useState('');
    const [editHargaRp, setEditHargaRp] = useState('');
    const [editStokMin, setEditStokMin] = useState('0');

    // Kategori dan satuan cukup dimuat sekali, tidak setiap ganti halaman
    useEffect(() => {
        Promise.all([apiClient.get('/kategori'), apiClient.get('/satuan')])
            .then(([resKat, resSat]) => {
                setDaftarKategori(resKat.data?.data || []);
                setDaftarSatuan(resSat.data?.data || []);

                if (resKat.data?.data?.length > 0) setKategoriId(resKat.data.data[0].id);
                if (resSat.data?.data?.length > 0) setSatuanDasarId(resSat.data.data[0].id);
            })
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, []);

    const tanganiSimpan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSimpanMemuat(true);
        try {
            await apiClient.post('/produk', {
                kategori_produk_id: kategoriId,
                satuan_dasar_id: satuanDasarId,
                sku,
                nama,
                tipe_jual: tipeJual,
                harga_rp: hargaRp || '0',
                stok_minimum: stokMin,
                deskripsi: deskripsi || null,
                aktif: true,
            });

            tambahToast('sukses', `Produk ${nama} berhasil ditambahkan.`);
            setModalBuka(false);
            setSku('');
            setNama('');
            setHargaRp('');
            setDeskripsi('');
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setSimpanMemuat(false);
        }
    };

    const bukaModalEdit = (p: Produk) => {
        setProdukEdit(p);
        setEditNama(p.nama);
        const hargaUtama = p.satuan_produk?.[0]?.harga_aktif?.harga_rp || '';
        setEditHargaRp(hargaUtama);
        setEditStokMin(p.stok_minimum);
        setModalEditBuka(true);
    };

    const tanganiPerbarui = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!produkEdit) return;

        setEditMemuat(true);
        try {
            await apiClient.patch(`/produk/${produkEdit.id}`, {
                nama: editNama,
                harga_rp: editHargaRp || '0',
                stok_minimum: editStokMin,
            });

            tambahToast('sukses', `Produk ${editNama} berhasil diperbarui.`);
            setModalEditBuka(false);
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setEditMemuat(false);
        }
    };

    const tanganiArsip = async (p: Produk) => {
        const setuju = await konfirmasi({
            judul: 'Arsipkan Produk?',
            rincian: `${p.nama} tidak akan tampil lagi di katalog kasir.`,
            labelSetuju: 'Arsipkan',
            bahaya: true,
        });
        if (!setuju) return;

        try {
            await apiClient.delete(`/produk/${p.id}`);
            tambahToast('info', `Produk ${p.nama} berhasil diarsipkan.`);
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        }
    };

    return (
        <div className="space-y-3">
            {/* Header Kontrol */}
            <Kartu className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-[#14221b]">Katalog Produk & Harga</h2>
                    <p className="text-xs text-[#5f756b]">Kelola data sayuran, satuan jual, dan riwayat harga bertanggal.</p>
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

                    <div className="flex items-center border border-[#e3ece7] rounded-xl overflow-hidden p-0.5 bg-[#f6f9f7]">
                        <button
                            onClick={() => setModeTampilan('grid')}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${modeTampilan === 'grid' ? 'bg-white text-[#007b40] shadow-xs font-semibold' : 'text-[#5f756b]'}`}
                            title="Tampilan Grid"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setModeTampilan('tabel')}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${modeTampilan === 'tabel' ? 'bg-white text-[#007b40] shadow-xs font-semibold' : 'text-[#5f756b]'}`}
                            title="Tampilan Tabel"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <Tombol
                        varian="primary"
                        ukuran="sm"
                        onClick={() => setModalBuka(true)}
                        ikon={<Plus className="w-3.5 h-3.5" />}
                    >
                        Tambah Produk
                    </Tombol>
                </div>
            </Kartu>

            {/* Filter Bar: Kategori Chips & Pencarian */}
            <Kartu className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3">
                {/* Horizontal Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <button
                        onClick={() => setKategoriTerpilih('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                            kategoriTerpilih === 'all'
                                ? 'bg-[#009f52] text-white shadow-xs'
                                : 'bg-white border border-[#e3ece7] text-[#14221b] hover:bg-[#e6f8ef]'
                        }`}
                    >
                        Semua Kategori
                    </button>
                    {daftarKategori.map((k) => (
                        <button
                            key={k.id}
                            onClick={() => setKategoriTerpilih(k.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                                kategoriTerpilih === k.id
                                    ? 'bg-[#009f52] text-white shadow-xs'
                                    : 'bg-white border border-[#e3ece7] text-[#14221b] hover:bg-[#e6f8ef]'
                            }`}
                        >
                            {k.nama}
                        </button>
                    ))}
                </div>

                {/* Pencarian Input */}
                <div className="w-full md:w-64">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            muatData();
                        }}
                    >
                        <Input
                            placeholder="Cari nama / SKU / barcode..."
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            ikonKiri={<Search className="w-4 h-4" />}
                        />
                    </form>
                </div>
            </Kartu>

            {error && <PesanKesalahan pesan={error} padaUlangi={muatData} />}

            {/* Main Content: Grid or Table */}
            {memuat ? (
                modeTampilan === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <SkeletonProduk key={i} />
                        ))}
                    </div>
                ) : (
                    <Kartu>
                        <SkeletonTabel baris={8} kolom={5} />
                    </Kartu>
                )
            ) : daftarProduk.length === 0 ? (
                <PanelKosong
                    judul="Produk Tidak Ditemukan"
                    deskripsi="Belum ada produk untuk kategori atau kata kunci yang dipilih. Tambahkan produk sayur pertama Anda."
                    labelAksi="Tambah Produk Baru"
                    padaKlikAksi={() => setModalBuka(true)}
                />
            ) : modeTampilan === 'grid' ? (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 transition-opacity duration-200 ${katalog.memuat ? 'opacity-60' : ''}`}>
                    {daftarProduk.map((p, indeksKartu) => {
                        const hargaUtama = p.satuan_produk?.[0]?.harga_aktif?.harga_rp || '0';
                        const kodeSatuan = p.satuan_dasar?.kode || 'kg';

                        return (
                            <div
                                key={p.id}
                                style={{ animationDelay: `${Math.min(indeksKartu, 14) * 28}ms` }}
                                className="animate-muncul-naik bg-white rounded-2xl border border-[#edf2ef] shadow-kartu p-3 flex flex-col justify-between hover:-translate-y-1 hover:border-[#b8eed3] hover:shadow-kartu-angkat transition-[translate,box-shadow,border-color] duration-200 group"
                            >
                                <div>
                                    <div className="w-full aspect-square rounded-xl bg-[#f6f9f7] flex items-center justify-center text-4xl mb-2.5 overflow-hidden border border-[#e3ece7]/60">
                                        {p.foto_url ? (
                                            <img
                                                src={p.foto_url}
                                                alt={p.nama}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>🥬</span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-[#5f756b] mb-1 font-mono">
                                        <span>{p.sku}</span>
                                        <Badge varian={p.tipe_jual === 'timbang' ? 'mint' : 'netral'}>
                                            {p.tipe_jual}
                                        </Badge>
                                    </div>

                                    <h4 className="text-xs font-bold text-[#14221b] line-clamp-2 leading-snug mb-1">
                                        {p.nama}
                                    </h4>
                                </div>

                                <div className="mt-2 pt-2 border-t border-[#e3ece7]/60">
                                    <div className="text-xs font-bold text-[#009f52] mb-2">
                                        {formatRupiah(hargaUtama)}
                                        <span className="text-[10px] text-[#5f756b] font-normal">
                                            /{kodeSatuan}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => bukaModalEdit(p)}
                                            className="flex-1 py-1.5 px-2 bg-[#f6f9f7] hover:bg-[#e6f8ef] text-[#14221b] hover:text-[#007b40] rounded-lg text-xs font-medium border border-[#e3ece7] flex items-center justify-center gap-1 transition-colors"
                                            title="Edit Produk & Harga"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Ubah</span>
                                        </button>
                                        <button
                                            onClick={() => tanganiArsip(p)}
                                            className="p-1.5 bg-[#f6f9f7] hover:bg-red-50 text-[#5f756b] hover:text-red-600 rounded-lg text-xs border border-[#e3ece7] transition-colors"
                                            title="Arsipkan"
                                        >
                                            <Archive className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Kartu className="p-0 overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#f1f4f2] text-[#14221b] font-bold">
                            <tr>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Kategori</th>
                                <th className="px-4 py-3">Satuan Dasar</th>
                                <th className="px-4 py-3 text-right">Harga Reguler</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3f0]">
                            {daftarProduk.map((p) => {
                                const hargaUtama = p.satuan_produk?.[0]?.harga_aktif?.harga_rp || '0';
                                return (
                                    <tr key={p.id} className="hover:bg-[#f6f9f7]">
                                        <td className="px-4 py-3 font-semibold text-[#14221b]">
                                            {p.nama}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[#5f756b]">
                                            {p.sku}
                                        </td>
                                        <td className="px-4 py-3 text-[#5f756b]">
                                            {p.kategori?.nama || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge varian="mint">{p.satuan_dasar?.nama || '-'}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-[#009f52]">
                                            {formatRupiah(hargaUtama)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => bukaModalEdit(p)}
                                                    className="p-1 hover:text-[#009f52]"
                                                    title="Ubah"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => tanganiArsip(p)}
                                                    className="p-1 hover:text-red-600"
                                                    title="Arsipkan"
                                                >
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Kartu>
            )}

            {daftarProduk.length > 0 && (
                <Kartu className="p-3">
                    <Paginasi daftar={katalog} opsiPerHalaman={[10, 20, 50]} />
                </Kartu>
            )}

            {/* Modal Tambah Produk Baru */}
            <Dialog
                terbuka={modalBuka}
                padaTutup={() => setModalBuka(false)}
                judul="Tambah Produk Sayur Baru"
                deskripsi="Daftarkan SKU produk, satuan jual, dan harga awal toko."
                lebarMaks="max-w-lg"
            >
                <form onSubmit={tanganiSimpan} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Kode SKU Produk"
                            required
                            placeholder="Contoh: SAY-WRT-01"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                        />
                        <Input
                            label="Nama Produk"
                            required
                            placeholder="Contoh: Wortel Berastagi"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[#14221b] block mb-1">
                                Kategori
                            </label>
                            <select
                                value={kategoriId}
                                onChange={(e) => setKategoriId(e.target.value)}
                                className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2 focus:outline-none focus:border-[#009f52]"
                            >
                                {daftarKategori.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#14221b] block mb-1">
                                Satuan Dasar
                            </label>
                            <select
                                value={satuanDasarId}
                                onChange={(e) => setSatuanDasarId(e.target.value)}
                                className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2 focus:outline-none focus:border-[#009f52]"
                            >
                                {daftarSatuan.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nama} ({s.kode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[#14221b] block mb-1">
                                Tipe Penjualan
                            </label>
                            <select
                                value={tipeJual}
                                onChange={(e) => setTipeJual(e.target.value as any)}
                                className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2 focus:outline-none focus:border-[#009f52]"
                            >
                                <option value="timbang">Timbang (kg / gram)</option>
                                <option value="satuan">Cacah (ikat / buah / pak)</option>
                            </select>
                        </div>

                        <Input
                            label="Harga Jual Perdana (Rp)"
                            type="number"
                            required
                            placeholder="Contoh: 18000"
                            value={hargaRp}
                            onChange={(e) => setHargaRp(e.target.value)}
                            ikonKiri={<DollarSign className="w-4 h-4" />}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Batas Stok Minimum"
                            type="number"
                            step="0.001"
                            placeholder="Contoh: 5.0"
                            value={stokMin}
                            onChange={(e) => setStokMin(e.target.value)}
                        />
                        <Input
                            label="Deskripsi / Catatan"
                            placeholder="Sayuran segar hidroponik"
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#e3ece7]">
                        <Tombol
                            type="button"
                            varian="secondary"
                            ukuran="md"
                            onClick={() => setModalBuka(false)}
                        >
                            Batal
                        </Tombol>
                        <Tombol
                            type="submit"
                            varian="primary"
                            ukuran="md"
                            memuat={simpanMemuat}
                        >
                            Simpan Produk
                        </Tombol>
                    </div>
                </form>
            </Dialog>

            {/* Modal Edit Produk & Harga */}
            <Dialog
                terbuka={modalEditBuka}
                padaTutup={() => setModalEditBuka(false)}
                judul={`Ubah Produk: ${produkEdit?.nama}`}
                deskripsi="Perbarui nama produk, penyesuaian harga jual, dan stok minimum."
            >
                <form onSubmit={tanganiPerbarui} className="space-y-3">
                    <Input
                        label="Nama Produk"
                        required
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                    />

                    <Input
                        label="Harga Jual Reguler (Rp)"
                        type="number"
                        required
                        value={editHargaRp}
                        onChange={(e) => setEditHargaRp(e.target.value)}
                        bantuan="Perubahan harga otomatis dicatat pada riwayat harga bertanggal tanpa mengubah transaksi masa lalu."
                        ikonKiri={<DollarSign className="w-4 h-4" />}
                    />

                    <Input
                        label="Batas Stok Minimum"
                        type="number"
                        step="0.001"
                        value={editStokMin}
                        onChange={(e) => setEditStokMin(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#e3ece7]">
                        <Tombol
                            type="button"
                            varian="secondary"
                            ukuran="md"
                            onClick={() => setModalEditBuka(false)}
                        >
                            Batal
                        </Tombol>
                        <Tombol
                            type="submit"
                            varian="primary"
                            ukuran="md"
                            memuat={editMemuat}
                        >
                            Simpan Perubahan
                        </Tombol>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};
