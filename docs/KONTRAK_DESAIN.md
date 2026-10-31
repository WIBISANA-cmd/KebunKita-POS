# KEBUN KITA POS — KONTRAK DESAIN UI/UX & IMPLEMENTASI ANTISLOP

**Status:** Ditetapkan  
**Filosofi:** Bersih, Fungsional, Terasa dibuat oleh desainer (Bukan AI Slop Generic)  
**Referensi Visual:** `Modern Mint Food Ordering Dashboard.png`  
**Filter Antislop:** `antislop active: during (session override).`

---

## 1. Analisis Referensi Visual (FoodHage -> Kebun Kita Adaptation)

Referensi visual menampilkan antarmuka POS/Kasir modern dengan karakteristik:
- **Latar belakang:** Sangat lembut, putih kehijauan / mint (`#f7faf8` hingga `#ffffff`).
- **Kartu Produk:** Kartu putih berlatar bersih dengan sudut melengkung halus (`border-radius: 14px`), border lembut (`#e3ece7`), foto produk di tengah dengan rasio proporsional, nama produk tebal terbaca, label harga Rupiah kontras, dan tombol aksi "Tambah" hijau mint/emerald yang menonjol.
- **Kategori Filter:** Deretan kartu kategori horizontal dengan ikon minimalis yang relevan (sayur, buah, bumbu, organik, semua) dan status aktif berlatar hijau mint berteks hijau gelap.
- **Panel Keranjang (Order Cart):** Berada di sisi kanan dengan pembagian tab tipe pesanan (Makan di Tempat / Bawa Pulang), daftar item ringkas dengan kontrol kuantitas `[-]` dan `[+]`, subtotal, diskon, PPN, dan tombol aksi utama "Bayar" (Charge) berukuran penuh di bagian bawah.

---

## 2. Keputusan Navigasi Responsif

| Perangkat | Komposisi Navigasi | Alasan & Kontrak Desain |
|---|---|---|
| **Desktop (> 1024px)** | **TOP NAVBAR** (Bukan sidebar vertikal permanen) | Memaksimalkan area horizontal untuk katalog produk 4–5 kolom dan panel kasir sticky di kanan. Menu navigasi: `Dashboard`, `Kasir`, `Produk`, `Stok`, `Pembelian`, `Keuangan`, `Laporan`, profil pengguna & status cabang. |
| **Mobile (< 768px)** | **Hamburger Header + SIDEBAR DRAWER** | Area sempit dioptimalkan untuk 1–2 kolom kartu produk, tombol floating untuk membuka keranjang dalam bentuk drawer/bottom sheet yang mudah dijangkau satu tangan. |

---

## 3. Design Tokens & Palet Warna

```css
:root {
  /* Brand Primary */
  --kk-primary: #009f52;       /* Emerald Green Segar */
  --kk-primary-dark: #007b40;  /* State Hover / Pressed */
  --kk-primary-light: #e6f8ef; /* Mint Lembut untuk Chip / Background Aktif */

  /* Neutral & Surfaces */
  --kk-bg: #f7faf8;            /* Latar Belakang Aplikasi */
  --kk-surface: #ffffff;       /* Kartu & Container */
  --kk-border: #e3ece7;        /* Border Halus */
  --kk-text: #14221b;          /* Kontras Tinggi untuk Teks Utama */
  --kk-text-muted: #5f756b;    /* Teks Sekunder / Meta */

  /* Semantic Feedback */
  --kk-danger: #e02424;        /* Hapus / Stok Habis / Error */
  --kk-warning: #d97706;       /* Menipis / Perhatian */
  --kk-info: #0284c7;

  /* Dimensions & Spacing */
  --kk-radius: 14px;
  --kk-card-gap: 8px;          /* Kepadatan Tinggi 6-8px */
  --kk-card-padding: 14px;
  --kk-touch-min: 44px;        /* Aksesibilitas Touch Target */
}
```

---

## 4. Kaidah Anti-Slop (Pencegahan AI Generic UI)

Berdasarkan audit aturan `antislop` dan `antislop-ui`:
1. **Dilarang Gradien Ungu-Biru AI:** Menggunakan palet putih, mint, dan emerald khas sayuran segar Kebun Kita.
2. **Tanpa Efek Glassmorphism Berlebihan:** Semua kartu berlatar solid (`#ffffff`) untuk kontras tinggi dan performa render cepat.
3. **Kepadatan Informasi Terjaga (Card Gap 6–8px):** Menghindari whitespace berlebihan yang membuat kasir harus banyak scrolling.
4. **Skeleton Granular per Komponen:**
   - Loading katalog = skeleton kartu yang mempertahankan ukuran kartu asli (gambar placeholder, garis judul, tombol).
   - Loading tabel = skeleton baris dan sel; header dan filter tetap interaktif.
   - DILARANG menggunakan loading spinner layar penuh (full-page spinner) untuk fetch data biasa.
5. **State Mutasi Submit:**
   - Tombol submit menampilkan **spinner kecil di dalam tombol**, teks tetap terbaca atau menunjukkan "Menyimpan...", tombol otomatis disabled untuk mencegah double submit.
   - Input form tidak boleh direset ketika terjadi error validasi (422).
6. **Bebas Data Palsu:**
   - Tidak menampilkan KPI palsu ("+240% omzet") jika sistem belum memiliki data. Gunakan empty state realistis dalam Bahasa Indonesia yang membimbing pengguna (misalnya: "Belum ada transaksi hari ini. Silakan buka shift dan mulai transaksi pertama.").

