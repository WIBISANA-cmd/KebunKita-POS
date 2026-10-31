# Panduan Handover & Checklist Pengujian Manual (Kebun Kita POS)

Dokumen ini disusun untuk **Developer Manusia** yang akan mengoperasikan, menjalankan seeder awal, dan menguji seluruh alur transaksi fungsional pada aplikasi **Kebun Kita POS**.

---

## 1. Persiapan Lingkungan & Database

### Prasyarat:
- **PHP**: >= 8.2 (Aktif: PHP 8.5.10 dengan ekstensi `pdo_pgsql`, `pgsql`, `bcmath`, `curl`, `intl`, `mbstring`)
- **Composer**: >= 2.x
- **Node.js & npm**: Node >= 20.x, npm >= 10.x
- **PostgreSQL**: PostgreSQL 16+ (Aktif: PostgreSQL 18.6 pada port 5432)

### Langkah Setup Awal:
```bash
# 1. Pastikan berkas .env telah terkonfigurasi dengan database PostgreSQL
# Salin dari .env.example jika belum ada:
cp .env.example .env

# 2. Buat App Key jika belum di-generate:
php artisan key:generate

# 3. Jalankan migrasi database:
php artisan migrate

# 4. Jalankan seeder data awal (Cabang, Pengguna default, Satuan, Kategori, Metode Bayar):
php artisan db:seed

# 5. Build asset frontend produksi:
npm run build

# 6. Jalankan server lokal:
php artisan serve
# Di terminal lain (jika masa pengembangan interaktif):
npm run dev
```

---

## 2. Akun & Kredensial Pengujian Default

| Peran | Email | Kata Sandi Default | Hak Akses Utama |
|---|---|---|---|
| **Pemilik (Super Admin)** | `pemilik@kebunkita.id` | `AdminKebunKita2026!` | Akses seluruh cabang, laporan keuangan komprehensif, manajemen staf |
| **Kasir Toko** | `kasir@kebunkita.id` | `KasirKebunKita2026!` | Buka/tutup shift kasir, transaksi POS, timbangan sayur, cetak struk |
| **Supervisor Gudang** | `gudang@kebunkita.id` | `GudangKebunKita2026!` | PO Pembelian, penerimaan barang bertahap, alokasi lot FEFO, opname & susut |

---

## 3. Checklist Pengujian Manual Developer (Step-by-Step)

Developer manusia dapat memverifikasi fungsionalitas sistem melalui skenario pengujian berurutan berikut:

### Skenario 1: Autentikasi Sanctum & Scope Cabang
- [ ] Buka browser di `http://127.0.0.1:8000`.
- [ ] Masuk dengan akun `kasir@kebunkita.id`.
- [ ] Periksa cookie `laravel_session` dan token CSRF di Developer Tools (Application -> Cookies).
- [ ] Pastikan tidak ada token JWT tersimpan di `localStorage`.
- [ ] Verifikasi nama pengguna dan nama cabang muncul pada navbar atas.

### Skenario 2: Siklus Shift Kasir (Buka Shift)
- [ ] Masuk ke menu **Kasir**.
- [ ] Verifikasi dialog "Buka Shift Kasir Baru" muncul saat shift belum aktif.
- [ ] Masukkan modal awal laci uang, misal `Rp 100.000`.
- [ ] Klik "Buka Shift Sekarang".
- [ ] Pastikan status shift kasir di bar atas berubah menjadi hijau: `Shift Buka: Rp 100.000`.

### Skenario 3: Transaksi POS Kasir & Alokasi FEFO
- [ ] Pilih kategori sayuran dari horizontal chips (Semua, Sayuran Daun, Buah, dll.).
- [ ] Cari produk menggunakan search bar (misal: "Bayam", "Kangkung", "Apel").
- [ ] **Produk Satuan (Pcs/Ikat)**: Klik kartu produk atau tombol "+ Tambah". Item masuk ke keranjang di panel kanan dengan kuantitas 1.
- [ ] **Produk Timbang (Kg/Gram)**: Klik produk bertipe timbang. Masukkan berat pada dialog timbangan (misal: `0.350` kg). Klik "Masukkan Keranjang".
- [ ] Ubah kuantitas di keranjang menggunakan tombol `[+]` dan `[-]`.
- [ ] Masukkan diskon nota (jika ada).
- [ ] Klik tombol hijau besar **"Bayar Rp [Total]"**.
- [ ] Pada dialog pembayaran:
  - Pilih metode "Tunai".
  - Klik tombol pecahan cepat (misal `Rp 50.000` atau `Rp 100.000`).
  - Verifikasi perhitungan nominal kembalian otomatis.
  - Klik "Konfirmasi & Selesaikan".
- [ ] Verifikasi modal nota struk 80mm muncul dengan rincian produk, subtotal, diskon, pajak, tunai, dan kembalian.
- [ ] Klik "Cetak Struk" untuk menguji print preview nota.

### Skenario 4: Pembelian & Penerimaan Bertahap (FEFO Generator)
- [ ] Masuk ke menu **Pembelian**.
- [ ] Klik "Buat Pesanan Beli (PO)".
- [ ] Pilih pemasok, pilih produk, satuan, kuantitas beli, dan harga beli per satuan. Simpan PO.
- [ ] Klik tombol "Setujui PO" pada pesanan beli berstatus draft.
- [ ] Klik tombol "Terima Barang" (Penerimaan Bertahap):
  - Masukkan kuantitas yang diterima (bisa parsial).
  - Masukkan tanggal kedaluwarsa batch sayur/buah.
  - Masukkan biaya satuan HPP masuk.
  - Simpan penerimaan.
- [ ] Masuk ke menu **Stok**: periksa bahwa lot baru bertanggal kedaluwarsa telah tercatat pada tabel lot aktif, dan saldo stok bertambah.

### Skenario 5: Stock Opname & Pencatatan Susut (Wastage)
- [ ] Masuk ke menu **Stok**.
- [ ] Klik "Catat Susut Sayur (Limbah/Rusak)".
- [ ] Pilih produk yang layu atau rusak, masukkan kuantitas susut dan alasan (misal: `busuk`).
- [ ] Simpan susut: verifikasi bahwa saldo stok berkurang dan beban kerugian susut tercatat di sistem.

### Skenario 6: Retur Penjualan & Pemilahan Barang
- [ ] Masuk ke menu **Retur**.
- [ ] Klik "Proses Retur Baru".
- [ ] Masukkan nomor nota transaksi penjualan (misal nomor nota yang baru dibuat pada Skenario 3).
- [ ] Klik "Cari Nota": rincian item transaksi tampil.
- [ ] Masukkan kuantitas item yang diretur.
- [ ] Tentukan kondisi:
  - Jika **Layak Jual**: stok dikembalikan ke rak toko kasir secara otomatis.
  - Jika **Rusak/Busuk**: stok dialihkan ke audit susut barang tanpa menambah stok siap jual.
- [ ] Pilih metode refund dana (Tunai: saldo kas laci shift berkurang secara otomatis).
- [ ] Klik "Konfirmasi & Refund Dana".

### Skenario 7: Rekonsiliasi & Tutup Shift Kasir
- [ ] Kembali ke menu **Kasir**.
- [ ] Klik "Tutup Shift" pada bar hijau atas.
- [ ] Periksa saldo kas sistem (modal awal + penerimaan tunai - kembalian - refund tunai).
- [ ] Masukkan hasil hitung fisik uang di laci kasir:
  - Jika cocok: selisih `Rp 0`.
  - Jika ada selisih: masukkan catatan penjelasan selisih.
- [ ] Klik "Tutup & Rekonsiliasi Shift". Shift resmi tertutup.

### Skenario 8: Dashboard Analitik & Ekspor Laporan
- [ ] Masuk ke menu **Dashboard**:
  - Verifikasi angka KPI: Omzet Bersih, Total Transaksi, Laba Kotor HPP FEFO, Kerugian Susut Sayur.
  - Periksa bar chart 7 hari terakhir.
  - Periksa daftar Top 5 Sayur Terlaris.
- [ ] Masuk ke menu **Laporan**:
  - Filter tanggal awal dan tanggal akhir.
  - Buka tab "Rekap Penjualan": klik **"Unduh CSV Excel"** dan periksa berkas CSV terunduh dengan format UTF-8 BOM.
  - Buka tab "Laba Rugi Operasional": periksa hierarki akuntansi (Pendapatan Bersih -> HPP Aktual FEFO -> Laba Kotor -> Beban Susut -> Laba Bersih Operasional).

---

## 4. Keterbatasan Eksternal (`BLOCKED_EXTERNAL`)

Sesuai kontrak arsitektur pada blueprint:
- **Payment Gateway Pihak Ketiga (QRIS Dinamis / Midtrans / Xendit)**:
  Telah disediakan kontrak adapter produksi pada `App\Services\Pembayaran\ProduksiGatewayAdapter`.
  Bila kredensial `PAYMENT_GATEWAY_SERVER_KEY` belum diisi di `.env`, API akan secara transparan mengembalikan status `BLOCKED_EXTERNAL`. Sistem tidak pernah memalsukan callback atau membuat QRIS palsu. Kasir operasional menggunakan verifikasi pembayaran tunai, transfer bank manual, atau QRIS statis toko.
- **Hardware Thermal Printer & Timbangan Digital RS232/USB**:
  Cetak struk menggunakan native web print browser CSS `@media print` 80mm yang kompatibel dengan seluruh printer thermal USB/Bluetooth tanpa dependensi driver vendor pihak ketiga.

