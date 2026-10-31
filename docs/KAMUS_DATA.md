# KEBUN KITA POS — KAMUS DATA & SKEMA DATABASE POSTGRESQL

**Status:** Ditetapkan  
**Database:** PostgreSQL 18+  
**Konvensi:** Nama tabel & kolom bisnis Bahasa Indonesia `snake_case`, PK UUIDv7 / ULID (`id`), Timestamp `dibuat_pada` / `diubah_pada` (atau `created_at` / `updated_at` dengan indeks `timestamptz`).

---

## 1. Klasifikasi Tabel

| Kategori | Tabel | Karakteristik / Mutabilitas |
|---|---|---|
| **Master Data** | `cabang`, `pengguna`, `peran`, `izin`, `pengguna_peran`, `peran_izin`, `pengaturan_toko`, `kategori_produk`, `satuan`, `produk`, `satuan_produk`, `harga_produk`, `pemasok`, `pelanggan`, `lokasi_stok`, `metode_bayar`, `kategori_biaya` | Master terkelola, perubahan harga berstatus bertanggal, penghapusan lunak/arsip. |
| **Event Ledger (Immutable / Append-Only)** | `dokumen_stok`, `mutasi_stok`, `alokasi_jual_lot`, `mutasi_kas`, `audit_aksi` | Append-only. Baris tidak boleh di-UPDATE atau di-DELETE setelah diposting. Koreksi dilakukan dengan dokumen reversal. |
| **Materialized / Saldo Terpelihara** | `saldo_stok`, `lot_stok` | Saldo cepat hasil agregasi ledger stok. Dimodifikasi dalam transaksi atomik dengan row-locking (`FOR UPDATE`). |
| **Dokumen Transaksional (Stateful)** | `pesanan_beli`, `item_beli`, `terima_beli`, `item_terima`, `shift_kasir`, `penjualan`, `item_jual`, `bayar_jual`, `retur_jual`, `item_retur`, `refund_bayar`, `opname_stok`, `item_opname`, `susut_stok`, `item_susut`, `pengeluaran` | Memiliki status / siklus hidup (state machine). Snapshot harga, diskon, dan HPP dikunci saat finalisasi. |

---

## 2. Rincian Skema Tabel

### 2.1 Master & Keamanan
- `cabang`:
  - `id` (uuid, PK)
  - `kode` (varchar(20), UNIQUE)
  - `nama` (varchar(100))
  - `alamat` (text)
  - `telepon` (varchar(30))
  - `zona_waktu` (varchar(50), default 'Asia/Jakarta')
  - `aktif` (boolean, default true)
- `pengguna`:
  - `id` (uuid, PK)
  - `nama` (varchar(100))
  - `email` (varchar(150), UNIQUE)
  - `sandi_hash` (varchar(255))
  - `telepon` (varchar(30), nullable)
  - `aktif` (boolean, default true)
  - `remember_token` (varchar(100), nullable)
- `peran`: `id` (uuid, PK), `kode` (varchar(50), UNIQUE), `nama` (varchar(100)), `deskripsi` (text, nullable)
- `izin`: `id` (uuid, PK), `kode` (varchar(100), UNIQUE), `nama` (varchar(150))
- `pengguna_peran`: `pengguna_id` (FK), `peran_id` (FK), `cabang_id` (FK, nullable untuk pemilik lintas cabang). UNIQUE (`pengguna_id`, `peran_id`, `cabang_id`)
- `peran_izin`: `peran_id` (FK), `izin_id` (FK). UNIQUE (`peran_id`, `izin_id`)
- `audit_aksi`:
  - `id` (uuid, PK)
  - `pengguna_id` (uuid, nullable, FK)
  - `cabang_id` (uuid, nullable, FK)
  - `aksi` (varchar(50)) -- mis. CREATE, UPDATE, DELETE, APPROVAL, LOGIN
  - `entitas` (varchar(100))
  - `entitas_id` (varchar(100))
  - `data_lama` (jsonb, nullable)
  - `data_baru` (jsonb, nullable)
  - `ip_address` (varchar(45), nullable)
  - `user_agent` (text, nullable)
  - `dibuat_pada` (timestamptz)
- `pengaturan_toko`:
  - `id` (uuid, PK)
  - `cabang_id` (uuid, nullable, FK)
  - `kunci` (varchar(100))
  - `nilai_json` (jsonb)
  - UNIQUE (`cabang_id`, `kunci`)

### 2.2 Katalog Produk & Harga
- `kategori_produk`: `id` (uuid, PK), `nama` (varchar(100)), `induk_id` (uuid, nullable, FK self), `urutan` (integer, default 0), `aktif` (boolean, default true)
- `satuan`: `id` (uuid, PK), `kode` (varchar(20), UNIQUE), `nama` (varchar(50)), `jenis` (varchar(30)) -- berat, volume, kemasan, cacah
- `produk`:
  - `id` (uuid, PK)
  - `kategori_produk_id` (uuid, FK)
  - `satuan_dasar_id` (uuid, FK)
  - `sku` (varchar(50), UNIQUE)
  - `nama` (varchar(150))
  - `deskripsi` (text, nullable)
  - `tipe_jual` (varchar(30), default 'timbang') -- 'timbang' (kg/gram) atau 'satuan' (ikat/buah/pak)
  - `foto_url` (varchar(255), nullable)
  - `stok_minimum` (numeric(18,3), default 0)
  - `aktif` (boolean, default true)
- `satuan_produk`:
  - `id` (uuid, PK)
  - `produk_id` (uuid, FK)
  - `satuan_id` (uuid, FK)
  - `faktor_ke_dasar` (numeric(20,6), NOT NULL, CHECK > 0)
  - `barcode` (varchar(50), nullable, UNIQUE)
  - `bisa_dijual` (boolean, default true)
  - `bisa_dibeli` (boolean, default true)
- `harga_produk`:
  - `id` (uuid, PK)
  - `satuan_produk_id` (uuid, FK)
  - `cabang_id` (uuid, nullable, FK)
  - `jenis_harga` (varchar(30), default 'reguler') -- reguler, grosir, promo
  - `harga_rp` (numeric(18,0), NOT NULL, CHECK >= 0)
  - `mulai_pada` (timestamptz, NOT NULL)
  - `akhir_pada` (timestamptz, nullable)
- `pemasok`: `id` (uuid, PK), `nama` (varchar(150)), `kontak` (varchar(100), nullable), `telepon` (varchar(30), nullable), `alamat` (text, nullable), `aktif` (boolean, default true)
- `pelanggan`: `id` (uuid, PK), `nama` (varchar(150)), `telepon` (varchar(30), nullable, UNIQUE), `email` (varchar(150), nullable), `alamat` (text, nullable), `poin` (integer, default 0), `aktif` (boolean, default true)

### 2.3 Persediaan & Pembelian
- `lokasi_stok`: `id` (uuid, PK), `cabang_id` (uuid, FK), `kode` (varchar(30)), `nama` (varchar(100)), `tipe` (varchar(30)) -- gudang, rak_toko, retur. UNIQUE (`cabang_id`, `kode`)
- `pesanan_beli`: `id` (uuid, PK), `cabang_id` (uuid, FK), `pemasok_id` (uuid, FK), `nomor` (varchar(50), UNIQUE), `status` (varchar(30)), `total_rp` (numeric(18,0)), `catatan` (text, nullable)
- `item_beli`: `id` (uuid, PK), `pesanan_beli_id` (uuid, FK), `produk_id` (uuid, FK), `satuan_produk_id` (uuid, FK), `qty` (numeric(18,3)), `harga_rp` (numeric(18,0)), `subtotal_rp` (numeric(18,0))
- `terima_beli`: `id` (uuid, PK), `pesanan_beli_id` (uuid, FK), `lokasi_stok_id` (uuid, FK), `nomor` (varchar(50), UNIQUE), `waktu_terima` (timestamptz), `penerima_id` (uuid, FK)
- `item_terima`: `id` (uuid, PK), `terima_beli_id` (uuid, FK), `item_beli_id` (uuid, FK), `qty_diterima` (numeric(18,3)), `biaya_satuan_rp` (numeric(20,6)), `kedaluwarsa_pada` (timestamptz, nullable)
- `lot_stok`:
  - `id` (uuid, PK)
  - `produk_id` (uuid, FK)
  - `lokasi_stok_id` (uuid, FK)
  - `item_terima_id` (uuid, nullable, FK)
  - `kode_lot` (varchar(50))
  - `qty_awal` (numeric(18,3))
  - `qty_sisa` (numeric(18,3), CHECK >= 0)
  - `hpp_dasar` (numeric(20,6))
  - `kedaluwarsa_pada` (timestamptz, nullable)
- `saldo_stok`:
  - `id` (uuid, PK)
  - `produk_id` (uuid, FK)
  - `lokasi_stok_id` (uuid, FK)
  - `qty_dasar` (numeric(18,3), default 0)
  - UNIQUE (`produk_id`, `lokasi_stok_id`)
- `dokumen_stok`: `id` (uuid, PK), `cabang_id` (uuid, FK), `jenis` (varchar(50)), `nomor` (varchar(50), UNIQUE), `referensi_id` (varchar(100), nullable), `waktu_posting` (timestamptz)
- `mutasi_stok`:
  - `id` (uuid, PK)
  - `dokumen_stok_id` (uuid, FK)
  - `produk_id` (uuid, FK)
  - `lokasi_stok_id` (uuid, FK)
  - `lot_stok_id` (uuid, nullable, FK)
  - `qty_delta` (numeric(18,3)) -- positif (masuk) atau negatif (keluar)
  - `nilai_hpp_rp` (numeric(20,6))
  - `keterangan` (text, nullable)
- `opname_stok`: `id` (uuid, PK), `cabang_id` (uuid, FK), `lokasi_stok_id` (uuid, FK), `nomor` (varchar(50), UNIQUE), `status` (varchar(30)), `waktu_hitung` (timestamptz), `disetujui_oleh` (uuid, nullable, FK)
- `item_opname`: `id` (uuid, PK), `opname_stok_id` (uuid, FK), `produk_id` (uuid, FK), `lot_stok_id` (uuid, nullable, FK), `qty_sistem` (numeric(18,3)), `qty_fisik` (numeric(18,3)), `selisih` (numeric(18,3))
- `susut_stok`: `id` (uuid, PK), `cabang_id` (uuid, FK), `lokasi_stok_id` (uuid, FK), `nomor` (varchar(50), UNIQUE), `status` (varchar(30)), `alasan` (varchar(100)), `disetujui_oleh` (uuid, nullable, FK)
- `item_susut`: `id` (uuid, PK), `susut_stok_id` (uuid, FK), `lot_stok_id` (uuid, FK), `qty` (numeric(18,3)), `nilai_hpp_rp` (numeric(20,6))

### 2.4 Kasir, Penjualan, & Pembayaran
- `shift_kasir`:
  - `id` (uuid, PK)
  - `cabang_id` (uuid, FK)
  - `pengguna_id` (uuid, FK)
  - `waktu_buka` (timestamptz)
  - `waktu_tutup` (timestamptz, nullable)
  - `modal_awal_rp` (numeric(18,0))
  - `saldo_sistem_rp` (numeric(18,0), default 0)
  - `saldo_fisik_rp` (numeric(18,0), nullable)
  - `selisih_rp` (numeric(18,0), nullable)
  - `catatan_selisih` (text, nullable)
  - `status` (varchar(30), default 'buka') -- buka, tutup
- `penjualan`:
  - `id` (uuid, PK)
  - `cabang_id` (uuid, FK)
  - `shift_kasir_id` (uuid, FK)
  - `pelanggan_id` (uuid, nullable, FK)
  - `nomor` (varchar(50), UNIQUE)
  - `waktu_penjualan` (timestamptz)
  - `status` (varchar(30), default 'draft') -- draft, menunggu_bayar, selesai, batal, retur_sebagian, retur_penuh
  - `subtotal_rp` (numeric(18,0))
  - `diskon_rp` (numeric(18,0), default 0)
  - `pajak_rp` (numeric(18,0), default 0)
  - `total_rp` (numeric(18,0))
  - `hpp_total_rp` (numeric(18,0), default 0)
  - `idempotency_key` (varchar(100), nullable, UNIQUE)
- `item_jual`:
  - `id` (uuid, PK)
  - `penjualan_id` (uuid, FK)
  - `produk_id` (uuid, FK)
  - `satuan_produk_id` (uuid, FK)
  - `nama_snapshot` (varchar(150))
  - `qty` (numeric(18,3))
  - `harga_snapshot_rp` (numeric(18,0))
  - `diskon_rp` (numeric(18,0), default 0)
  - `total_rp` (numeric(18,0))
  - `hpp_rp` (numeric(18,0), default 0)
- `alokasi_jual_lot`:
  - `id` (uuid, PK)
  - `item_jual_id` (uuid, FK)
  - `lot_stok_id` (uuid, FK)
  - `qty_dasar` (numeric(18,3))
  - `hpp_rp` (numeric(20,6))
- `metode_bayar`: `id` (uuid, PK), `kode` (varchar(30), UNIQUE), `nama` (varchar(50)), `jenis` (varchar(30)), `aktif` (boolean, default true)
- `bayar_jual`:
  - `id` (uuid, PK)
  - `penjualan_id` (uuid, FK)
  - `metode_bayar_id` (uuid, FK)
  - `nilai_rp` (numeric(18,0))
  - `diterima_rp` (numeric(18,0))
  - `kembalian_rp` (numeric(18,0), default 0)
  - `status` (varchar(30), default 'sukses') -- sukses, pending, gagal
  - `ref_eksternal` (varchar(100), nullable)
- `mutasi_kas`:
  - `id` (uuid, PK)
  - `shift_kasir_id` (uuid, FK)
  - `jenis` (varchar(30)) -- penjualan_tunai, kembalian, kas_masuk_manual, kas_keluar_manual, refund_tunai
  - `masuk_rp` (numeric(18,0), default 0)
  - `keluar_rp` (numeric(18,0), default 0)
  - `nomor_ref` (varchar(100), nullable)
  - `keterangan` (text, nullable)
- `retur_jual`:
  - `id` (uuid, PK)
  - `penjualan_id` (uuid, FK)
  - `nomor` (varchar(50), UNIQUE)
  - `waktu_retur` (timestamptz)
  - `alasan` (text)
  - `status` (varchar(30)) -- diproses, selesai, ditolak
  - `total_refund_rp` (numeric(18,0))
- `item_retur`:
  - `id` (uuid, PK)
  - `retur_jual_id` (uuid, FK)
  - `item_jual_id` (uuid, FK)
  - `qty` (numeric(18,3))
  - `nilai_refund_rp` (numeric(18,0))
  - `layak_jual` (boolean, default true)
- `refund_bayar`:
  - `id` (uuid, PK)
  - `retur_jual_id` (uuid, FK)
  - `metode_bayar_id` (uuid, FK)
  - `nilai_rp` (numeric(18,0))
- `kategori_biaya`: `id` (uuid, PK), `nama` (varchar(100))
- `pengeluaran`: `id` (uuid, PK), `cabang_id` (uuid, FK), `kategori_biaya_id` (uuid, FK), `nilai_rp` (numeric(18,0)), `waktu` (timestamptz), `keterangan` (text, nullable), `status` (varchar(30))

