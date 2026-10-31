import React from 'react';
import type { Cabang, Penjualan } from '@/tipe';

export interface DataStruk {
    penjualan: Penjualan;
    cabang: Cabang | null;
    namaKasir: string;
    namaPelanggan: string | null;
    tipePesanan: string;
    biayaLayananRp: number;
}

const LABEL_TIPE: Record<string, string> = {
    dine_in: 'Di Tempat',
    take_away: 'Bawa Pulang',
    delivery: 'Kirim',
    custom: 'Kustom',
};

const rupiah = (nilai: number | string): string =>
    `Rp ${(Number(nilai) || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

const formatJumlah = (qty: string): string =>
    parseFloat(qty).toLocaleString('id-ID', { maximumFractionDigits: 3 });

const Garis: React.FC = () => <div className="struk-garis" />;

const BarisHarga: React.FC<{ label: string; nilai: string; tebal?: boolean }> = ({ label, nilai, tebal }) => (
    <div className={`struk-baris ${tebal ? 'struk-tebal' : ''}`}>
        <span>{label}</span>
        <span className="struk-angka">{nilai}</span>
    </div>
);

// Dipakai bersama oleh pratinjau di layar dan salinan cetak agar keduanya selalu sama.
export const StrukNota: React.FC<{ data: DataStruk; id?: string; className?: string }> = ({ data, id, className }) => {
    const { penjualan, cabang, namaKasir, namaPelanggan, tipePesanan, biayaLayananRp } = data;
    const waktu = new Date(penjualan.waktu_penjualan);
    const items = penjualan.items ?? [];
    const pembayaran = penjualan.pembayaran ?? [];
    const diskon = Number(penjualan.diskon_rp) || 0;
    const pajak = Number(penjualan.pajak_rp) || 0;
    const kembalian = pembayaran.reduce((jumlah, b) => jumlah + (Number(b.kembalian_rp) || 0), 0);
    const total = (Number(penjualan.total_rp) || 0) + biayaLayananRp;

    return (
        <div id={id} className={`struk ${className ?? ''}`}>
            <header className="struk-kepala">
                <svg viewBox="0 0 24 24" className="struk-logo" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M7 20h10" />
                    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
                    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
                </svg>
                <div className="struk-merek">KEBUN KITA</div>
                {cabang && <div className="struk-cabang">{cabang.nama}</div>}
                {cabang?.alamat && <div className="struk-kecil">{cabang.alamat}</div>}
                {cabang?.telepon && <div className="struk-kecil">Telp. {cabang.telepon}</div>}
            </header>

            <div className="struk-pita">
                <span>LUNAS</span>
                <span>{LABEL_TIPE[tipePesanan] ?? tipePesanan}</span>
            </div>

            <div className="struk-info">
                <BarisHarga label="No. Nota" nilai={penjualan.nomor} tebal />
                <BarisHarga
                    label="Tanggal"
                    nilai={waktu.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
                <BarisHarga
                    label="Jam"
                    nilai={`${waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`}
                />
                <BarisHarga label="Kasir" nilai={namaKasir} />
                {namaPelanggan && <BarisHarga label="Pelanggan" nilai={namaPelanggan} />}
            </div>

            <Garis />

            <div className="struk-item-daftar">
                {items.map((item) => {
                    const diskonItem = Number(item.diskon_rp) || 0;
                    return (
                        <div key={item.id} className="struk-item">
                            <div className="struk-item-nama">{item.nama_snapshot}</div>
                            <div className="struk-baris">
                                <span>
                                    {formatJumlah(item.qty)} {item.satuan_snapshot} x {rupiah(item.harga_snapshot_rp)}
                                </span>
                                <span className="struk-angka struk-tebal">{rupiah(item.total_rp)}</span>
                            </div>
                            {diskonItem > 0 && <div className="struk-kecil">Hemat {rupiah(diskonItem)}</div>}
                        </div>
                    );
                })}
            </div>

            <Garis />

            <div className="struk-ringkasan">
                <BarisHarga label={`Subtotal (${items.length} produk)`} nilai={rupiah(penjualan.subtotal_rp)} />
                {diskon > 0 && <BarisHarga label="Diskon" nilai={`-${rupiah(diskon)}`} />}
                {pajak > 0 && <BarisHarga label="Pajak" nilai={rupiah(pajak)} />}
                {biayaLayananRp > 0 && <BarisHarga label="Biaya Layanan" nilai={rupiah(biayaLayananRp)} />}
            </div>

            <div className="struk-total">
                <span>TOTAL</span>
                <span className="struk-angka">{rupiah(total)}</span>
            </div>

            <div className="struk-ringkasan">
                {pembayaran.map((bayar) => (
                    <React.Fragment key={bayar.id ?? bayar.metode_bayar_id}>
                        <BarisHarga label={bayar.metode_bayar?.nama ?? 'Pembayaran'} nilai={rupiah(bayar.diterima_rp)} />
                        {bayar.ref_eksternal && <div className="struk-kecil">Ref. {bayar.ref_eksternal}</div>}
                    </React.Fragment>
                ))}
                {kembalian > 0 && <BarisHarga label="Kembalian" nilai={rupiah(kembalian)} tebal />}
            </div>

            <Garis />

            <footer className="struk-kaki">
                <div className="struk-terima-kasih">Terima kasih!</div>
                <div className="struk-kecil">Sayuran sehat langsung dari petani lokal</div>
                <div className="struk-kecil">Simpan struk ini sebagai bukti transaksi</div>
            </footer>
        </div>
    );
};

/**
 * Ukuran halaman disesuaikan dengan tinggi struk supaya tidak ada kertas kosong
 * dan seluruh struk tercetak dalam satu halaman.
 */
export function cetakStruk(elemenPratinjau: HTMLElement | null): void {
    const tinggiMm = elemenPratinjau ? Math.ceil((elemenPratinjau.offsetHeight * 25.4) / 96) + 4 : 297;
    const gaya = document.createElement('style');
    gaya.textContent = `@page { size: 80mm ${tinggiMm}mm; margin: 0; }`;
    document.head.appendChild(gaya);

    window.addEventListener('afterprint', () => gaya.remove(), { once: true });
    window.print();
}
