import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Store, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Tombol } from '@/komponen/ui/Tombol';
import { Kartu } from '@/komponen/ui/Kartu';
import { Paginasi, useDaftarBerhalaman } from '@/komponen/ui/Paginasi';
import { Input } from '@/komponen/ui/Input';
import { Badge } from '@/komponen/ui/Badge';
import { Tabel, type KolomTabel } from '@/komponen/ui/Tabel';
import { Dialog } from '@/komponen/ui/Dialog';
import { SkeletonTabel } from '@/komponen/ui/SkeletonTabel';
import { PesanKesalahan } from '@/komponen/ui/PesanKesalahan';
import { apiClient, ekstrakPesanError } from '@/layanan/apiClient';
import type { Pengguna, Cabang } from '@/tipe';

export interface HalamanPenggunaProps {
    penggunaSaatIni?: Pengguna | null;
    tambahToast: (tipe: 'sukses' | 'error' | 'info', pesan: string) => void;
}

export const HalamanPengguna: React.FC<HalamanPenggunaProps> = ({
    penggunaSaatIni: _penggunaSaatIni,
    tambahToast,
}) => {
    const [daftarCabang, setDaftarCabang] = useState<Cabang[]>([]);

    const daftarAkun = useDaftarBerhalaman<Pengguna>('/pengguna', { perHalaman: 15 });
    const daftarPengguna = daftarAkun.data;
    const memuat = daftarAkun.memuat && daftarPengguna.length === 0;
    const error = daftarAkun.galat;
    const muatData = daftarAkun.muatUlang;

    // Modal Form State
    const [modalBuka, setModalBuka] = useState(false);
    const [simpanMemuat, setSimpanMemuat] = useState(false);
    const [nama, setNama] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telepon, setTelepon] = useState('');
    const [cabangId, setCabangId] = useState('');

    useEffect(() => {
        apiClient
            .get('/cabang')
            .then((res) => setDaftarCabang(res.data?.data || []))
            .catch((err) => tambahToast('error', ekstrakPesanError(err)));
    }, []);

    const tanganiSimpan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSimpanMemuat(true);
        try {
            await apiClient.post('/pengguna', {
                nama,
                email,
                password,
                telepon: telepon || null,
                cabang_id: cabangId || null,
                aktif: true,
            });

            tambahToast('sukses', `Pengguna ${nama} berhasil ditambahkan.`);
            setModalBuka(false);
            setNama('');
            setEmail('');
            setPassword('');
            setTelepon('');
            setCabangId('');
            muatData();
        } catch (err) {
            tambahToast('error', ekstrakPesanError(err));
        } finally {
            setSimpanMemuat(false);
        }
    };

    const kolom: KolomTabel<Pengguna>[] = [
        {
            kunci: 'nama',
            judul: 'Pengguna',
            render: (item) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#e6f8ef] text-[#007b40] font-bold text-xs flex items-center justify-center shrink-0">
                        {item.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-[#14221b]">{item.nama}</div>
                        <div className="text-[11px] text-[#5f756b]">{item.email}</div>
                    </div>
                </div>
            ),
        },
        {
            kunci: 'cabang',
            judul: 'Cabang',
            render: (item) => (
                <div className="flex items-center gap-1.5 text-xs text-[#5f756b]">
                    <Store className="w-3.5 h-3.5 text-[#009f52]" />
                    <span>{item.cabang?.nama || 'Pusat / Semua Cabang'}</span>
                </div>
            ),
        },
        {
            kunci: 'peran',
            judul: 'Peran',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#5f756b]" />
                    <span>{item.peran?.[0]?.nama || 'Pengguna'}</span>
                </div>
            ),
        },
        {
            kunci: 'aktif',
            judul: 'Status',
            render: (item) => (
                item.aktif ? (
                    <Badge varian="sukses">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                        Aktif
                    </Badge>
                ) : (
                    <Badge varian="bahaya">
                        <XCircle className="w-3 h-3 mr-1 inline" />
                        Nonaktif
                    </Badge>
                )
            ),
        },
    ];

    return (
        <div className="space-y-3">
            <Kartu className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-[#14221b]">Manajemen Pengguna & Staf</h2>
                    <p className="text-xs text-[#5f756b]">Kelola staf kasir, manajer, dan pembatasan akses cabang.</p>
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
                        onClick={() => setModalBuka(true)}
                        ikon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                        Tambah Pengguna
                    </Tombol>
                </div>
            </Kartu>

            {error && <PesanKesalahan pesan={error} padaUlangi={muatData} />}

            {memuat ? (
                <Kartu>
                    <SkeletonTabel baris={5} kolom={4} />
                </Kartu>
            ) : (
                <Tabel
                    kolom={kolom}
                    data={daftarPengguna}
                    kunciUnik={(p) => p.id}
                    pesanKosong="Belum ada pengguna lain yang terdaftar."
                />
            )}

            {daftarPengguna.length > 0 && (
                <Kartu className="p-3">
                    <Paginasi daftar={daftarAkun} />
                </Kartu>
            )}

            {/* Modal Tambah Pengguna */}
            <Dialog
                terbuka={modalBuka}
                padaTutup={() => setModalBuka(false)}
                judul="Tambah Pengguna / Staf Baru"
                deskripsi="Daftarkan akun staf baru dengan hak akses yang terisolasi."
            >
                <form onSubmit={tanganiSimpan} className="space-y-3">
                    <Input
                        label="Nama Lengkap"
                        required
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                    />

                    <Input
                        label="Alamat Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="budi@kebunkita.id"
                    />

                    <Input
                        label="Kata Sandi (Min. 8 karakter)"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <Input
                        label="Nomor Telepon / WhatsApp"
                        value={telepon}
                        onChange={(e) => setTelepon(e.target.value)}
                        placeholder="08123456789"
                    />

                    <div>
                        <label className="text-xs font-semibold text-[#14221b] block mb-1">
                            Penugasan Cabang
                        </label>
                        <select
                            value={cabangId}
                            onChange={(e) => setCabangId(e.target.value)}
                            className="w-full bg-white text-[#14221b] text-sm rounded-xl border border-[#e3ece7] px-3 py-2 focus:outline-none focus:border-[#009f52]"
                        >
                            <option value="">Pusat / Semua Cabang</option>
                            {daftarCabang.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nama} ({c.kode})
                                </option>
                            ))}
                        </select>
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
                            Simpan Staf
                        </Tombol>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};
