# KEBUN KITA POS — ATURAN BISNIS & LOGIKA DOMAIN

**Status:** Ditetapkan  
**Tanggal:** 30 Oktober 2026  
**Referensi:** `KEBUN_KITA_IMPLEMENTATION_BLUEPRINT.md`

---

## 1. Satuan, Kuantitas, dan Konversi

1. **Satuan Dasar Produk**
   - Setiap produk memiliki tepat satu `satuan_dasar_id` (contoh: `kg` untuk sayur timbang, `ikat` untuk kangkung/bayam, `buah` untuk semangka/melon, `pak` untuk sayuran salad kemasan).
   - Seluruh mutasi persediaan, alokasi lot, dan saldo dihitung dalam **satuan dasar**.
2. **Satuan Jual / Satuan Produk**
   - Satu produk dapat memiliki beberapa satuan turunan pada tabel `satuan_produk` dengan nilai `faktor_ke_dasar` (`numeric(20,6)`).
   - Contoh Konversi Sah:
     - `Wortel Berastagi`: Satuan dasar `kg`. Satuan jual:
       - `kg`: faktor `1.000000`
       - `gram`: faktor `0.001000` (pembelian `275 gram` = `0.275 kg`)
       - `kemasan 500g`: faktor `0.500000`
     - `Bayam Cabut`: Satuan dasar `ikat`. Satuan jual:
       - `ikat`: faktor `1.000000`
       - `pak 3 ikat`: faktor `3.000000`
   - Dilarang mengonversi satuan yang tidak ekuivalen tanpa timbangan fisik (contoh: dilarang otomatis mengonversi `ikat` ke `kg` tanpa input penimbangan).
3. **Presisi Desimal & Kalkulasi Harga**
   - Formula nominal per item:  
     $$\text{total\_item} = \text{round}(\text{qty} \times \text{harga\_satuan\_rp} - \text{diskon\_item\_rp})$$
   - Menggunakan mode pembulatan standar akuntansi Indonesia (`PHP_ROUND_HALF_UP`).
   - Contoh validasi: `0.275 kg × Rp 18.000/kg = Rp 4.950`.

---

## 2. Penetapan Harga Dinamis

1. **Struktur Harga**
   - Disimpan di `harga_produk` dengan cakupan: `satuan_produk_id`, `cabang_id` (nullable untuk default), `jenis_harga` (`reguler`, `grosir`, `promo`), `harga_rp`, `mulai_pada`, `akhir_pada`.
2. **Resolusi Harga Aktif**
   - Sistem memilih harga dengan spesifisitas tertinggi:
     1. Harga spesifik cabang yang valid pada `waktu_transaksi` (antara `mulai_pada` dan `akhir_pada`).
     2. Jika tidak ada harga cabang, menggunakan harga default nasional/toko utama.
3. **Immutability Transaksi**
   - Setiap transaksi penjualan menyimpan snapshot harga satuan pada `item_jual.harga_snapshot_rp`. Perubahan harga setelah transaksi tidak boleh mengubah histori keuangan.

---

## 3. Manajemen Persediaan, FEFO, dan HPP Lot

1. **Metode Alokasi: FEFO (First Expired, First Out)**
   - Saat transaksi penjualan atau pemakaian barang keluar diposting:
     1. Sistem mengurutkan lot aktif berdasarkan `kedaluwarsa_pada ASC NULLS LAST`, kemudian `dibuat_pada ASC` (FIFO fallback jika tidak memiliki tanggal kedaluwarsa).
     2. Melakukan row-level locking (`SELECT ... FOR UPDATE`) pada `saldo_stok` dan `lot_stok` dengan urutan ID konsisten untuk mencegah deadlock.
     3. Mengurangi `qty_sisa` pada setiap lot hingga kuantitas terpenuhi.
2. **Kalkulasi HPP Nyata (Actual Lot Cost)**
   - Satu item transaksi penjualan dapat dipenuhi dari lebih dari satu lot.
   - HPP item dihitung secara proporsional dari setiap alokasi lot pada `alokasi_jual_lot`:
     $$\text{hpp\_item} = \sum (\text{qty\_alokasi} \times \text{hpp\_lot\_dasar})$$
3. **Pencatatan Ledger Stok**
   - Setiap mutasi persediaan WAJIB memiliki record induk `dokumen_stok` (jenis: `penjualan`, `penerimaan_beli`, `retur_jual`, `opname`, `susut`) dan baris rincian `mutasi_stok`.
   - `saldo_stok` hanya berfungsi sebagai cache baca cepat (materialized read model) yang selalu sejalan dengan akumulasi ledger `mutasi_stok`.

---

## 4. State Machine & Siklus Transaksi Penjualan

1. **Status Penjualan:**
   - `draft`: Keranjang disimpan / pesanan pending. Belum memotong stok.
   - `menunggu_bayar`: Invoice diterbitkan (misalnya untuk transfer/QRIS).
   - `selesai`: Pembayaran telah diverifikasi sah secara penuh, stok dipotong via FEFO, mutasi kas tercatat (jika tunai), nota dapat dicetak.
   - `batal`: Pesanan dibatalkan sebelum selesai.
   - `retur_sebagian`: Sebagian barang diretur resmi.
   - `retur_penuh`: Seluruh barang diretur resmi.
2. **Finalisasi Transaksi:**
   - Waktu finalisasi stok: Hanya dipotong ketika status berpindah ke `selesai`.
   - Idempotency Key wajib disertakan untuk mencegah race condition / double charge akibat koneksi terputus atau double click.

---

## 5. Siklus Pembelian dan Penerimaan (PO)

1. **Status Pesanan Beli (PO):**
   - `draft` -> `disetujui` -> `diterima_sebagian` -> `diterima_penuh` / `batal`.
2. **Penerimaan Barang (Goods Receipt):**
   - Penerimaan barang dapat dilakukan bertahap/parsial (`terima_beli`).
   - Setiap baris penerimaan (`item_terima`) menghasilkan satu `lot_stok` baru dengan atribut: kode lot, nomor batch, tanggal kedaluwarsa, biaya perolehan (HPP per unit dasar setelah alokasi ongkir/biaya lain), serta record `mutasi_stok` masuk (+).

---

## 6. Retur Penjualan dan Refund

1. **Validasi Kuantitas & Nilai:**
   - Kuantitas barang yang diretur tidak boleh melebihi:  
     $$\text{qty\_bersih} = \text{qty\_jual} - \text{qty\_sudah\_diretur}$$
   - Nilai refund tidak boleh melebihi nilai bersih yang dibayarkan konsumen untuk item tersebut.
2. **Klasifikasi Kondisi Retur:**
   - **Layak Jual (`layak_jual = true`):** Barang dikembalikan ke stok fisik, membuat mutasi stok masuk (+), memulihkan saldo stok, dan merekam reversal HPP.
   - **Rusak/Busuk (`layak_jual = false`):** Barang dimusnahkan/dibuang. Stok fisik TIDAK bertambah; transaksi dicatat sebagai retur finansial dengan pencatatan beban kerugian/susut.

---

## 7. Shift Kasir dan Rekonsiliasi Kas

1. **Siklus Kasir:**
   - Kasir membuka shift dengan menginput `modal_awal_rp`.
   - Sistem mencatat seluruh transaksi kas masuk (`penjualan_tunai`, `kas_masuk_manual`) dan kas keluar (`kembalian`, `kas_keluar_manual`, `refund_tunai`).
   - Pembayaran non-tunai (kartu debit, transfer, QRIS) DICATAT terpisah dan TIDAK dimasukkan ke dalam perhitungan uang fisik di laci kas.
2. **Tutup Shift & Selisih:**
   - Saat tutup shift, kasir memasukkan `saldo_fisik_rp` hasil hitung riil.
   - Sistem menghitung `kas_seharusnya`:
     $$\text{kas\_seharusnya} = \text{modal\_awal} + \text{kas\_masuk} - \text{kas\_keluar}$$
   - Selisih kas: $\Delta = \text{saldo\_fisik} - \text{kas\_seharusnya}$.
   - Jika $\Delta \neq 0$, kasir wajib mengisi keterangan alasan selisih dan sistem menandai butuh persetujuan manajer/supervisor.

---

## 8. Pajak dan Biaya

1. **Prinsip Konfigurasi:**
   - Tidak mengasumsikan tarif pajak tunggal permanen.
   - Disediakan pengaturan `pengaturan_toko` untuk PPN (aktif/nonaktif, persentase konfigurabel, contoh: 0% atau 11%).
   - Tipe harga: Dapat diatur inklusif atau eksklusif pajak.

