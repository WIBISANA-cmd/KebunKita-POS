# KEBUN KITA POS — KEPUTUSAN TEKNIS (ARCHITECTURE DECISION RECORDS)

**Status:** Ditetapkan  
**Tanggal:** 30 Oktober 2026  
**Referensi:** `KEBUN_KITA_IMPLEMENTATION_BLUEPRINT.md`

---

## 1. Stack Teknologi & Pola Arsitektur

1. **Backend: Laravel (Modular Monolith)**
   - Versi: Laravel kompatibel dengan PHP 8.5+ (menggunakan paket standar Laravel).
   - Pola: **Modular Monolith** dengan pemisahan domain yang bersih.
   - **Service Layer Pattern**: Seluruh kalkulasi bisnis (harga, diskon, PPN, pemotongan stok FEFO, HPP lot, penutupan shift, penerimaan PO, retur, dsb.) berada eksklusif di Service Layer (`app/Services/...`).
   - **Thin Controller**: Controller hanya bertindak sebagai adapter HTTP: `FormRequest` -> `Policy Authorization` -> `Service Execution` -> `API Resource Response`. Tidak ada kalkulasi bisnis di Controller maupun di Frontend.

2. **Frontend: React + TypeScript (TSX) SPA + Vite**
   - Single Page Application (SPA) pertama (first-party) disajikan via Vite bundle yang terintegrasi dengan backend Laravel.
   - Tidak menggunakan Blade untuk UI operasional kasir/dashboard. Blade hanya dipakai sebagai host container minimal (`resources/views/app.blade.php`) untuk bootstrap React root.
   - Desain Token & Styling: Tailwind CSS dengan design tokens kustom sesuai identitas Kebun Kita (White / Mint / Emerald).

3. **Database: PostgreSQL 18+**
   - Tipe data moneter: `numeric(18,0)` untuk Rupiah (IDR).
   - Tipe data kuantitas: `numeric(18,3)` untuk satuan berat/kg dengan presisi hingga miligram.
   - Tipe data faktor konversi: `numeric(20,6)`.
   - Tipe data HPP unit dasar: `numeric(20,6)`.
   - Serialisasi API: Seluruh nilai desimal dan moneter dikirim dan diterima sebagai **string** (contoh: `"18000"`, `"0.275"`), bukan IEEE-754 floating point JavaScript.

4. **Autentikasi & Keamanan: Laravel Sanctum (Session Cookie SPA)**
   - Autentikasi SPA first-party menggunakan HttpOnly, Secure, SameSite session cookies dengan CSRF protection (`/sanctum/csrf-cookie`).
   - Tidak menyimpan auth/bearer token di `localStorage` atau `sessionStorage`.
   - Otorisasi berlapis: Role-Based Access Control (RBAC) dengan pemetaan `pengguna -> pengguna_peran -> peran -> peran_izin -> izin`, dipadukan dengan Laravel Policies yang membatasi hak akses pada scope `cabang_id`.

5. **RESTful API Versioning**
   - Seluruh endpoint diawali dengan prefix `/api/v1/`.
   - Nomenklatur endpoint menggunakan kata benda jamak bahasa Indonesia: `/api/v1/produk`, `/api/v1/penjualan`, `/api/v1/pembelian`, dsb.
   - Header `Idempotency-Key` wajib disertakan pada mutasi kritis (finalisasi penjualan, pembayaran, posting stok opname, posting penerimaan).

6. **Zona Waktu & Tanggal**
   - Server internal & database PostgreSQL menyimpan data dalam `timestamptz` (standar UTC).
   - Tampilan antarmuka default dikonfigurasi ke `Asia/Jakarta` (WIB) dengan opsi konfigurasi per cabang jika membuka outlet di zona WITA/WIT.
   - Format mata uang antarmuka: `id-ID` (`Rp 18.000`).

7. **Konvensi Penamaan**
   - Database tables: `snake_case` Bahasa Indonesia (`produk`, `satuan_produk`, `harga_produk`, `saldo_stok`, `mutasi_stok`, `shift_kasir`, `penjualan`, `item_jual`, `alokasi_jual_lot`).
   - Eloquent Models: `PascalCase` Bahasa Indonesia (`Produk`, `SatuanProduk`, `HargaProduk`, `SaldoStok`, `MutasiStok`, `ShiftKasir`, `Penjualan`, `ItemJual`).
   - Framework metadata: Tetap mengikuti konvensi Laravel/PSR-4 (`Controller`, `Service`, `Request`, `Resource`, `Policy`).
   - Frontend components & pages: `PascalCase` Bahasa Indonesia (`HalamanKasir.tsx`, `HalamanProduk.tsx`, `PanelKeranjang.tsx`, `NavbarAtas.tsx`).

8. **Audit & Ketahanan Data**
   - Tabel `audit_aksi` bersifat append-only untuk merekam perubahan entitas sensitif (master harga, role, izin, koreksi stok, approval selisih kas).
   - Prinsip immutability ledger stok: saldo tidak pernah diubah secara langsung (`UPDATE saldo_stok SET ...`) tanpa pencatatan pada `dokumen_stok` dan `mutasi_stok`.

