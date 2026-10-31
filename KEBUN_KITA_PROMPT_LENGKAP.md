# KEBUN KITA POS — ALL-IN-ONE AGENT PROMPT PACK

> Paket instruksi siap pakai untuk Claude Code dan Google Antigravity. Ekstrak ZIP ke root yang telah berisi blueprint agar referensi gambar, file progres, dan aturan proyek ikut tersedia.

## Penggunaan singkat

Berikan agent instruksi: `Baca dan jalankan prompts/00_MASTER_MULAI_OTOMATIS.md. Implementasikan proyek langsung dan lanjutkan per modul tanpa berhenti pada rencana.`

Ketika konteks habis, berikan: `Baca dan eksekusi prompts/98_RESUME_MODUL.md. Pulihkan konteks dari repository dan checkpoint, langsung lanjut implementasi.`


---

## MASTER PROMPT

# MASTER PROMPT — KEBUN KITA POS / AUTONOMOUS DEVELOPMENT

Anda adalah **Lead Software Engineer, Laravel Architect, React TypeScript Engineer, PostgreSQL Data Architect, Security Engineer, dan Implementation Agent** yang memiliki akses langsung ke workspace. **TUGAS: KERJAKAN PROYEK, BUKAN MENYUSUN RENCANA SAJA.**

Workspace: `kebun-kita-POS/`. Pada awal proyek, workspace hanya berisi `KEBUN_KITA_IMPLEMENTATION_BLUEPRINT.md`, ditambah berkas aturan/prompt/referensi apabila paket instruksi telah disalin. Buka workspace root tersebut; jangan menginisialisasi proyek di subfolder tambahan tanpa alasan teknis kuat. Blueprint adalah sumber kebenaran utama; jangan menimpanya.

## LANGSUNG EKSEKUSI

1. Baca **SELURUH** `KEBUN_KITA_IMPLEMENTATION_BLUEPRINT.md` dan `CLAUDE.md` atau `AGENTS.md` yang tersedia. Baca `docs/PROGRES_PENGEMBANGAN.md` bila ada. Periksa berkas, versi tool, dan status Git aktual. Jangan mengasumsikan repo masih kosong setelah sesi pertama.
2. Temukan dan baca skill **Antislop** yang sudah terpasang melalui mekanisme skill agent. Jangan mengklaim telah menerapkannya tanpa membaca instruksinya. Jika skill tidak ditemukan, catat lokasinya yang dicari, jangan install ulang sembarangan, lalu tetap laksanakan design contract dari blueprint.
3. Buka `referensi/desain-pos-kebun-kita.png` jika tersedia; pahami layout, bentuk card, typography, skema putih–mint–hijau, kepadatan, katalog, panel kasir. Jika referensi tidak tersedia, gunakan design tokens pada blueprint dan tandai keterbatasan verifikasi visual. Gambar hanya referensi desain, **bukan** background screenshot yang menggantikan UI riil.
4. Periksa dependensi runtime: PHP/Composer, Node/npm, PostgreSQL, ekstensi PHP, Redis jika tersedia. Pilih versi stabil yang saling kompatibel berdasarkan lingkungan aktual dan dokumentasikan versinya. Jangan mengarang bahwa paket terpasang.
5. Mulai development secara mandiri **dari M00 sampai M09** secara berurutan (prompt file `01` sampai `10`); kerjakan bagian ekspansi M09 yang dapat diimplementasikan tanpa kredensial vendor/hardware. Instruksi modul tersedia di `prompts/01_DISCOVERY_KONTRAK.md` hingga `prompts/10_EKSPANSI.md`. Selesaikan satu *vertical slice* fungsional pada satu waktu: DB → API → service → frontend → state UI → dokumentasi → static check, lalu lanjut.
6. Perbarui `docs/PROGRES_PENGEMBANGAN.md` setelah setiap *vertical slice* dan sebelum mengakhiri sesi. Jika mendekati batas konteks, tuliskan checkpoint lengkap **sebelum** berhenti. Tidak perlu bertanya apakah akan melanjutkan selama tidak ada blocker nyata.

## KEPUTUSAN ARSITEKTUR TIDAK BOLEH DILANGGAR

- Backend Laravel modular monolith; frontend React + TypeScript (TSX) dengan Vite; PostgreSQL; RESTful JSON API versi `/api/v1`; tidak menggunakan Blade sebagai frontend operasional; hanya boleh ada Blade minimal untuk SPA bootstrap/halaman server yang memang diperlukan.
- **Service Layer memegang seluruh business logic**. Controller tetap dipakai sebagai adapter HTTP yang tipis: FormRequest → authorization → Service → API Resource. Jangan menaruh perhitungan harga, stok, pajak, diskon, retur, atau HPP di controller maupun frontend.
- Autentikasi SPA first-party menggunakan Laravel Sanctum session-cookie dengan CSRF, bukan menyimpan session token di `localStorage`. Semua akses server dibatasi Policies/RBAC serta scope cabang.
- Mata uang **IDR/Rupiah**, format `id-ID`; zona waktu tampilan default `Asia/Jakarta`; waktu server disimpan `timestamptz` konsisten; konfigurasi per cabang bila diperlukan.
- Tabel bisnis dan nama berkas/domain berbahasa Indonesia menggunakan singkatan mudah dipahami: `produk`, `item_jual`, `saldo_stok`, `penerimaan`, `HargaService`, `HalamanKasir.tsx`. Pertahankan nama teknis bawaan framework/PSR-4, metadata framework, dan istilah HTTP sesuai konvensi; **jangan merusak autoload atau tooling demi menerjemahkan semuanya**.
- Ledger mutasi stok dan snapshot transaksi historis harus auditable. Stok, FEFO, HPP lot, konversi satuan, penerimaan parsial, retur, pembayaran, shift kas, laporan saling konsisten. Server menghitung ulang harga/total dari sumber resmi.
- PostgreSQL `numeric` untuk uang/kuantitas: IDR `numeric(18,0)`, qty dasar `numeric(18,3)`, faktor `numeric(20,6)`, unit HPP `numeric(20,6)` sesuai blueprint; representasi desimal API sebagai **string**, jangan mengandalkan IEEE-754 float JS untuk transaksi moneter.
- Database transaksi atomik, foreign keys dan constraints, row locking saat pengurangan stok, idempotency key untuk finalisasi, policy authorization anti-IDOR, audit append-only pada operasi kritis, tidak ada stok minus karena race condition.
- Tidak ada pembayaran gateway yang dianggap sukses sebelum verifikasi sah. Integrasi pihak ketiga yang memerlukan credentials/hardware: siapkan adapter produksi dan konfigurasi yang aman; tandai `BLOCKED_EXTERNAL` untuk bagian yang benar-benar butuh akses vendor. **Jangan membuat QRIS palsu atau callback sukses palsu**.

## KONTRAK UI/UX — SOURCE OF TRUTH GAMBAR REFERENSI

- Warna dominan white/mint/emerald, kartu putih dengan soft border & shadow ringan, radius 12–16px, komposisi padat namun tetap terbaca; gap antar card **6–8px**. Gunakan Antislop untuk fidelity, keterbacaan, dan konsistensi, bukan redesign.
- **Desktop = TOP NAVBAR**; **mobile = hamburger + SIDEBAR DRAWER**. Ini sengaja berbeda dari navigasi sidebar desktop pada gambar. Kasir desktop: katalog utama dan panel pesanan/keranjang di kanan, responsif; mobile: katalog 1–2 kolom dan keranjang drawer/bottom sheet. Semua perangkat dapat dipakai.
- Gunakan design tokens global dan komponen UI reusable. Semua tombol, input, state kosong, pesan error, validasi, tooltip, tabel, dan filter harus jelas dalam bahasa Indonesia sehari-hari.
- **Fetch/read = skeleton granular** per bagian data terkecil yang bermakna (gambar, judul, harga, angka KPI, bar chart, sel tabel, input detail). Jangan gunakan loading spinner seluruh layar untuk satu request data. Skeleton mempertahankan ukuran card untuk mencegah layout shift.
- **Submit/mutasi = simple spinner pada tombol**, disabled hanya aksi yang terkait, cegah duplicate submit, jangan hapus input user ketika request gagal. Gunakan error/empty/retry/403/409/422/419/500 states yang konkret.
- Navigasi dan screen harus menggunakan API sungguhan; **dilarang menampilkan dummy KPI, mock order, atau hardcoded sukses sebagai data produksi**. Empty states realistis ketika database masih kosong.

## BATASAN TESTING — HANYA DEVELOPER MANUSIA

**JANGAN** menjalankan unit/feature/integration/E2E tests, browser automation, Playwright, Cypress, maupun manual app testing. **JANGAN** membuat test suites baru kecuali kelak diminta khusus. Developer manusia sendiri yang menguji aplikasi.

**BOLEH** jalankan pemeriksaan non-test: PHP syntax lint, Composer autoload checks, TypeScript typecheck, ESLint/static lint, Vite production compile, pemeriksaan referensi dan dependency. Static checks bukan bukti fungsi bebas bug. Jangan menjalankan migrasi destruktif/seeder/reset/rollback pada database yang tidak jelas disposable; buat file migration dan instruksi migrasi, minta konfirmasi hanya bila benar-benar perlu menyentuh data nyata.

## EKSEKUSI EFISIEN & PENGELOLAAN RISIKO

- Lakukan inspeksi singkat, lalu langsung edit kode. Jangan berhenti pada desain arsitektur, daftar tugas, atau pseudo-code. Buat perubahan lengkap lintas stack, bukan hanya halaman tampilan.
- Ikuti urutan dependensi modul. Jangan mengerjakan banyak modul tidak terkait sekaligus sehingga menghabiskan konteks dan menghasilkan kode separuh jadi.
- Jangan menambah dependensi tanpa alasan nyata; pilih primitive sederhana jika memadai. Jangan menggunakan microservices, GraphQL, Next.js, Firebase, SQLite, atau basis data lain yang tidak diminta.
- Jangan menghapus/mengganti perubahan user, `.env`, repo history, atau konfigurasi rahasia. Hindari `git reset --hard`, `git clean -fd`, force push, dan Git commit/push tanpa izin.
- Untuk keputusan yang belum didefinisikan, pilih default konservatif yang konsisten dengan blueprint, catat pada `docs/KEPUTUSAN_TEKNIS.md`, jangan berhenti karena hal minor. Bila benar-benar perlu data bisnis/legal/provider eksternal, isolasi blocker dan lanjutkan bagian yang tidak bergantung padanya.
- Semua SQL, mass assignment, akses cabang, upload file, transaksi ulang, dan export harus memakai whitelist/validation/authorization. Jangan menonaktifkan kontrol keamanan untuk mempercepat pekerjaan.
- **Tidak boleh mengklaim proyek/module selesai hanya karena halaman tampil atau build lolos**. Status harus berdasarkan cakupan implementasi dan pemeriksaan statis yang nyata.

## ATURAN CHECKPOINT WAJIB

Buat/perbarui `docs/PROGRES_PENGEMBANGAN.md` dengan: modul saat ini, status setiap modul (`BELUM`, `BERJALAN`, `SELESAI_IMPLEMENTASI`, `TERHALANG`), tugas terakhir selesai, tugas sedang dikerjakan, file yang diubah, migrasi/endpoint, keputusan, status static check, blocker eksternal, langkah konkret selanjutnya. Perbarui minimal setelah setiap vertical slice dan **sebelum konteks habis**.

Jika mulai sesi baru: baca progress + repo saat ini, cocokkan fakta kode dengan catatan, lalu **lanjut tugas kecil berikutnya**. Jangan scaffold ulang jika app sudah ada, jangan menggandakan migration, jangan reset DB, jangan mendeklarasikan modul tuntas tanpa memeriksa artefaknya.

## DONE CRITERIA PER MODUL

- Ruang lingkup terkait blueprint telah diimplementasikan dari DB sampai halaman UI yang berinteraksi dengan API nyata.
- Business rule penting termasuk input invalid, 403/404/409/422, nilai kosong, dan network failure telah ditangani dalam kode.
- Permissions dan scope cabang ditegakkan server-side; tidak ada secret dalam frontend.
- Skeleton per-data, tombol submit spinner, responsive dan konvensi nama konsisten.
- Typecheck/lint/build/syntax yang tersedia telah dijalankan atau alasan tidak dapat dijalankan dicatat; **functional tests tidak dijalankan**.
- Endpoint, tabel, dan perubahan penting didokumentasikan; status progress diperbarui; daftar alur manual yang harus diverifikasi developer disampaikan.

## OUTPUT STATUS SINGKAT, BUKAN CERAMAH

Setelah setiap modul atau sesi: tampilkan `MODUL | STATUS | FILE UTAMA | STATIC CHECK | RISIKO/BLOCKER | LANGKAH SELANJUTNYA`. Lanjut eksekusi ke modul berikutnya bila masih memungkinkan. Jangan meminta konfirmasi rutin.

**MULAI SEKARANG: BACA BLUEPRINT, BACA ANTISLOP, PERIKSA WORKSPACE, LALU IMPLEMENTASIKAN MODUL 00 → 09 SECARA BERTAHAP DAN NYATA. JANGAN HANYA MEMBUAT PLAN.**


---

## MODUL M00 DISCOVERY

# MODUL M00 — DISCOVERY & KONTRAK BISNIS (LANGSUNG EKSEKUSI)

Anda sedang mengerjakan **M00**. Baca blueprint 600 baris, aturan proyek, referensi visual, dan progress terbaru. Jika M00 sudah selesai, verifikasi artefak dan langsung pindah ke M01; jangan ulangi dokumen dari nol.

## Pekerjaan WAJIB

1. Inspeksi kondisi root (awalnya hanya blueprint), versi runtime dan ekstensi PostgreSQL/PHP/Node. Catat kendala nyata, bukan dugaan.
2. Buat `docs/KEPUTUSAN_TEKNIS.md` yang mengunci pilihan teknis: Laravel + React TS SPA + Vite + `/api/v1` + PostgreSQL, Sanctum cookie auth, modul Service Layer, Tailwind/design tokens, standar penamaan Indonesia, strategi nomor dokumen, audit, time zone/cabang.
3. Buat `docs/ATURAN_BISNIS.md`: state transition penjualan dan pembelian, waktu finalisasi stok, FEFO, HPP per lot, kuantitas & satuan, skema IDR/pembulatan, kebijakan harga per satuan dan tanggal, diskon, retur layak jual/rusak, modal awal shift, kas fisik vs non-tunai. Jika regulasi pajak/jenis usaha tidak diketahui, **konfigurabel, default konservatif**, jangan mengarang tarif wajib.
4. Buat `docs/KONTRAK_API.md` berisi standar request/response, decimal string, error mapping (401/403/404/409/419/422/429/500), pagination, filter, CSRF, API version, Idempotency-Key, correlation ID, format tanggal.
5. Buat `docs/KAMUS_DATA.md`: daftar tabel dalam blueprint, PK/FK, constraint, indeks inti, unique per cabang dan relasi lintas cabang, kolom audit. Nyatakan tabel mana untuk event ledger dan mana saldo terpelihara.
6. Identifikasi modul lengkap, ketergantungan, dan batas tanggung jawab frontend/backend. Lakukan penyesuaian minimal pada keputusan apabila ada ambiguitas; catat alasannya.
7. Periksa skill Antislop, baca dan catat konvensi yang relevan di `docs/KONTRAK_DESAIN.md`. Rujuk gambar UI. Jelaskan perbedaan **desktop top navbar** dan **mobile sidebar drawer**.

## Default aman saat blueprint menyisakan pilihan

- Mulai 1 cabang namun seluruh data transaksi bercakupan cabang.
- FEFO dengan HPP aktual lot; posting stok saat penjualan sah/selesai; payment pending bukan paid.
- Antarmuka IDR, `id-ID`, lokal `Asia/Jakarta`, database waktu UTC.
- Tanpa mode offline-first; tanpa integrasi gateway palsu; server menghitung semua nominal final.
- Tetapkan pemotongan stok dan koreksi transaksi melalui jurnal/reversal, bukan edit langsung ledger yang sudah diposting.

## Output/gate M00

Dokumen keputusan, aturan bisnis, kontrak API, kamus data, dan kontrak UI tersedia; tidak ada perubahan kode aplikasi yang menyalahi blueprint. Perbarui `docs/PROGRES_PENGEMBANGAN.md`: M00 `SELESAI_IMPLEMENTASI`, daftar keputusan dan next step. **LANJUT OTOMATIS KE M01**, jangan berhenti setelah dokumentasi kecuali environment menjadi blocker yang nyata.


---

## MODUL M01 FOUNDATION

# MODUL M01 — FOUNDATION / PROJECT BOOTSTRAP / DESIGN SYSTEM

**EKSEKUSI, BUKAN HANYA PLAN.** Baca blueprint, instruksi project, M00, progress dan keadaan filesystem. Bila framework sudah ada, lanjutkan tanpa menginisialisasi ulang atau menimpa perubahan.

## Backend foundation

- Inisialisasi Laravel stabil yang kompatibel dengan PHP/Composer saat ini **di root `kebun-kita-POS`**, mempertahankan blueprint, `prompts/`, `docs/`, gambar, dan rules yang ada. Jangan buat proyek Laravel nested.
- Konfigurasi PostgreSQL sebagai database utama; sertakan `.env.example` **tanpa secret**. Jangan memaksa koneksi DB real ataupun migrasi destruktif. Konfigurasi Sanctum SPA dan CSRF, API `/api/v1`, pagination, JSON error standard.
- Buat struktur `app/Services`, `Http/Controllers/Api/V1`, `Http/Requests`, `Http/Resources`, `Policies`, `Support`, `Jobs` dan pattern exception handling yang sesuai versi Laravel.
- Buat health endpoint internal yang tidak menampilkan credential atau secrets; pasang API versioning dan rate limit baseline.
- Tetapkan standar migration transaksi DB dan penamaan tabel Indonesia; jangan jalankan seed berisi password default produksi.

## Frontend foundation

- React + TypeScript TSX + Vite + Tailwind sesuai setup Laravel. Pastikan API client typed, error mapping, session credentials/CSRF, `id-ID` Rupiah, `Asia/Jakarta`, form validation, query provider, routing dan lazy loading seperlunya.
- Komponen dasar: `Tombol`, `Input`, `Pilih`, `Dialog`, `Kartu`, `Badge`, `Tabel`, `PanelKosong`, `PesanKesalahan`, `Skeleton`, `SkeletonTabel`, `SkeletonProduk`, `SkeletonGrafik`, `SpinnerTombol`, `Toast`, `Konfirmasi`, `NavbarAtas`, `SidebarMobile`, `KerangkaHalaman`.
- Desain mengacu gambar `referensi/desain-pos-kebun-kita.png`, Antislop dan design tokens. **Card gap 6–8px**; desktop top navbar, mobile sidebar drawer; aksesibilitas, keyboard, touch target, responsive.
- Routing halaman utama dan placeholder *empty state* untuk modul yang belum ada; **jangan** menampilkan KPI palsu dan mengaku fitur sudah berfungsi. Skeleton hanya saat benar-benar loading.
- Rancang state mutasi submit dengan spinner **di tombol**, bukan fullscreen spinner, dan perlindungan double submit.

## Mutu engineering

- Setup tooling lint, TypeScript strict, aliases seperlunya, formatting, `.gitignore`, `README.md` berisi cara instal, environment, build, dan hal yang dipegang developer.
- Dokumentasikan versi terpasang, alasan dependensi, nama command static check. Jalankan **hanya** syntax/typecheck/lint/build yang tersedia; jangan jalankan tests atau otomatis menjalankan migrations terhadap DB berisi data.

## Gate

Server API dapat dikompilasi secara statis, frontend bundle dapat dibangun jika dependensi tersedia, layout responsive dan UI kit tersedia, struktur service siap. Perbarui checkpoint + daftar perintah instalasi developer. Lanjut otomatis M02.


---

## MODUL M02 AUTH

# MODUL M02 — AUTENTIKASI, CABANG, RBAC, PENGGUNA, AUDIT

**KERJAKAN VERTICAL SLICE NYATA.** Baca blueprint + progress + M00/M01. Periksa file implementasi lebih dahulu. Jika dependensi M01 belum selesai, selesaikan yang spesifik dibutuhkan kemudian lanjutkan M02.

## Database & service

- Migration dan model `cabang`, `pengguna` (atau tabel otentikasi berbasis framework dengan mapping aman), `peran`, `izin`, `pengguna_peran`, `peran_izin`, `audit_aksi`, `pengaturan_toko`; key unik, FK, indeks, default aman.
- Service auth/session, pengelolaan pengguna, peran/izin, cabang aktif, audit append-only; Policies menegakkan izin **dan batas cabang** untuk setiap operasi.
- Login/logout/me/session renewal dan perubahan password via Sanctum cookie + CSRF. Login throttling, rotasi sesi, keamanan password. Bila memasang MFA bagi pemilik/admin, gunakan integrasi standar yang kuat, bukan algoritma buatan sendiri.
- Buat mekanisme onboarding admin aman melalui konfigurasi/CLI yang tidak menyertakan kredensial default. Pastikan role tidak bisa menaikkan haknya sendiri melalui mass assignment.

## REST API

- Endpoint auth (masuk/keluar/saya), pengguna, cabang, peran, izin, pengaturan toko, audit terbatas untuk peran berwenang. FormRequest validation, API Resources dan status HTTP tepat.
- Query data selalu menerapkan scope cabang dan authorization server-side. Jangan mengandalkan hidden menu di React.

## UI

- Halaman masuk, profil, pergantian cabang bila authorized, user & role management, pengaturan dasar, notifikasi akses ditolak.
- Top navbar desktop dan mobile drawer menampilkan menu yang dibolehkan oleh server. Session expired → pesan aman dan arah login tanpa kehilangan input penting tanpa pemberitahuan.
- Loading profil/izin/daftar pengguna = skeleton granular; simpan login/user/role = spinner pada tombol dengan disabled dan pesan 422.

## Security gate

Tidak ada IDOR lintas cabang atau eskalasi role melalui endpoint yang jelas; rahasia/credential tidak bocor di respons; account disabled tidak dapat beroperasi; audit dibuat untuk perubahan kritikal. Perbarui docs + progress, jalankan static checks saja, lanjut M03.


---

## MODUL M03 PRODUK

# MODUL M03 — PRODUK, KATEGORI, SATUAN, HARGA DINAMIS, PEMASOK/PELANGGAN

Implementasikan semua sisi (migration → model → service → API → UI) sesuai blueprint. Jangan pindah modul jika CRUD backend belum terhubung dengan halaman frontend riil.

## Data dan aturan

- Tabel `kategori_produk`, `satuan`, `produk`, `satuan_produk`, `harga_produk`, `pemasok`, `pelanggan`; relasi, FK, unique SKU/barcode, indeks search; status aktif/nonaktif dan histori perubahan harga.
- Satuan dasar per produk; jual per kg/gram/ikat/buah/bungkus. Konversi `numeric(20,6)` dengan qty dasar presisi; hanya konversi kompatibel dan mapping eksplisit. Contoh Rp18.000/kg × 0,275kg = Rp4.950 tanpa floating-point money.
- Harga ditetapkan per satuan jual, cabang, jenis harga, rentang aktif; cegah interval harga yang saling tumpang-tindih untuk kombinasi yang sama. Penjualan lama menyimpan snapshot harga dan tidak terpengaruh perubahan harga.
- Upload foto aman: MIME/content/size validation, storage aman, sanitasi nama file, fallback gambar, jangan expose disk private sembarangan.
- Tidak ada hard delete entitas yang dipakai transaksi; nonaktifkan/arsipkan secara terkontrol.

## Backend service & API

- `ProdukService`, `KategoriService`, `SatuanService`, `HargaService`, `PemasokService`, `PelangganService`. Controller thin + FormRequest + Policy + Resource.
- CRUD, pencarian SKU/nama/barcode, pagination/filter/sort allowlist, harga berlaku sekarang/yang dijadwalkan, histori harga, validasi konflik; lindungi seluruh endpoint dari cross-branch tampering.

## Frontend UI

- Halaman katalog produk, tambah/edit cepat dengan field masuk akal untuk awam, tabel/grid produk, filter kategori, pencarian, modal konfirmasi, upload foto, pengaturan satuan, tab riwayat harga, pemasok, pelanggan.
- Harga input/preview Rupiah, bantuan singkat untuk konversi satuan; skeleton kartu produk/field detail per bagian, spinner tombol untuk simpan, error 422 ditampilkan di field.
- Style konsisten dengan referensi dan Antislop, gap rapat 6–8px, responsif.

## Gate

Produk, barcode, satuan, harga bertanggal, supplier dan pelanggan bisa dikelola melalui API riil; harga historis tetap aman; seluruh dokumen/endpoint dibuat. Typecheck/lint/build yang tersedia, tanpa functional testing. Update checkpoint dan lanjut M04.


---

## MODUL M04 STOK

# MODUL M04 — PEMBELIAN, PENERIMAAN, LOT, FEFO, STOK, SUSUT, OPNAME

**INI MODUL KRITIS AKURASI.** Jangan membuat UI stok sekadar edit angka; semua pergerakan harus masuk ledger mutasi stok.

## Migration/data

- Implementasikan `lokasi_stok`, `pesanan_beli`, `item_beli`, `terima_beli`, `item_terima`, `lot_stok`, `saldo_stok`, `dokumen_stok`, `mutasi_stok`, `opname_stok`, `item_opname`, `susut_stok`, `item_susut` dengan FK/check/indeks/cabang konsisten.
- Ledger `mutasi_stok` append-only setelah posting; saldo `saldo_stok` terpelihara atomik; lot terkait penerimaan, tanggal kedaluwarsa, qty sisa, HPP dasar.
- Relasi antar dokumen harus traceable dan tidak menggunakan loose polymorphic identifiers tanpa validasi referensi yang kuat.

## Business service

- `PembelianService`: PO draft/approval/status, harga pembelian, pembatalan aman, nomor unik.
- `PenerimaanService`: barang dapat diterima sebagian/bertahap, qty aktual bukan qty pesanan; hitung biaya perolehan/HPP termasuk komponen biaya yang sah, lot dan mutasi dibuat atomik.
- `StokService`/`LotService`: saldo berdasarkan satuan dasar, FEFO per lot, row locking dan urutan lock konsisten, tidak ada negatif/overselling; API baca stok cepat dari saldo, report detail dari ledger.
- `OpnameService` & `SusutService`: hitung selisih, approval sesuai izin, susut sayur busuk/rusak, stok & nilai HPP berkurang hanya saat posting resmi. Ledger dan audit menjelaskan penyebab.
- Terapkan aturan pembulatan alokasi biaya dan nilai lot; jumlah biaya yang dibagikan harus rekonsiliasi dengan total dokumen.

## API & UI

- PO list/create/detail, penerimaan parsial, stok per produk/cabang/lokasi, lot, riwayat mutasi, daftar stok minimum, kedaluwarsa, opname, susut.
- Buat halaman operasional ringkas untuk staf awam: `Pesan`, `Terima`, `Lihat Stok`, `Opname`, `Catat Barang Rusak`; istilah dan instruksi bahasa Indonesia.
- Data list/card/table punya skeleton per baris/per kolom; tombol posting/persetujuan spinner kecil dan proteksi double-submit; untuk konflik stok/PO tampilkan pesan 409 yang jelas.

## Integritas dan gate

Tanpa mutasi langsung yang melewati ledger; tidak mengubah transaksi terposting melalui delete/edit; PO partial receipt dan lot FEFO terjaga; audit dan izin per cabang. Static checks saja, catat migrasi/API/risiko di checkpoint. Lanjut M05.


---

## MODUL M05 POS

# MODUL M05 — POS KASIR, KERANJANG, TRANSAKSI, SHIFT, NOTA

Prioritas tertinggi: kecepatan kasir, akurasi Rupiah dan stok, UI identik secara karakter dengan gambar referensi **tanpa menyalin screenshot sebagai halaman statis**.

## Data dan transaksi

- Implementasikan `shift_kasir`, `penjualan`, `item_jual`, `alokasi_jual_lot`, `metode_bayar`, `bayar_jual`, `mutasi_kas` bila belum ada. Kaitkan `cabang_id`, `pengguna_id`, nomor transaksi unik dan status yang terkendali.
- `KasirService`/`PenjualanService`: buka shift sebelum jual, katalog produk aktif, qty per satuan, validasi stok dan harga berlaku, diskon berdasarkan izin, total/PPN konfigurabel, bayar tunai, kembalian, selesaikan transaksi **atomik** dengan FEFO dan HPP lot.
- Server **WAJIB** mengulang hitung seluruh nominal dan memvalidasi harga/stock sebelum commit; frontend hanya preview. Penggunaan IDR integer dan decimal string. Gunakan lock stok yang konsisten dan `Idempotency-Key` untuk finalisasi agar retry tidak membuat duplikasi.
- Snapshot per item: nama, satuan, qty, harga, diskon, pajak dan HPP saat transaksi. Setelah selesai, jangan edit langsung; gunakan retur/reversal.
- Shift kasir: modal awal, penjualan tunai, kas masuk/keluar, kembalian, perhitungan saldo teoritis, uang fisik, selisih, approval bila perlu, tutup/lock shift.
- Nota cetak dengan CSS print yang layak; browser printing diaktifkan oleh user. Jangan menganggap printer thermal tertentu tersedia. Dokumentasikan adapter bila ada hardware.

## API

- Buka/lihat/tutup shift; ambil produk tersedia dan harga; buat draft transaksi bila diperlukan; finalisasi penjualan; lihat detail/nota; kas masuk/keluar. Gunakan FormRequest, API Resource, Policy per cabang, status HTTP yang tepat dan token idempotensi.
- Status pembayaran cash harus dibedakan dari digital pending. Jangan membuat rekaman transaksi selesai bila pembayaran tidak sesuai aturan.

## UI meniru referensi

- Desktop **top navbar**, sidebar mobile drawer. Tengah: kategori horizontal, pencarian cepat SKU/nama/barcode, grid gambar produk 4–5 kolom pada desktop besar dengan gap 6–8px; kanan: panel order sticky, item, qty, pengaturan satuan, diskon, subtotal, pajak, total, tombol aksi bayar hijau.
- Mobile: katalog 1–2 kolom, cart drawer/bottom sheet, tombol checkout mudah dijangkau; tanpa horizontal overflow yang rusak.
- Keranjang: tambah, hapus, tambah/kurangi qty, input gram/kg, edit unit, diskon dengan izin, kosongkan dengan konfirmasi, bayar tunai, input uang diterima, kembalian Rp, cetak nota.
- Skeleton granular per foto/nama/harga/barang, spinner tombol saat submit, disabled hanya saat mutasi terkait, tampilkan keadaan offline/network, 409 harga/stok berubah, 422 salah qty, 403 diskon ditolak, 419 sesi habis.

## Gate

Jalur kasir dari katalog sampai pembayaran tunai, posting mutasi stok/HPP, shift, dan nota **sudah memiliki kode integrasi end-to-end** (tanpa menjalankan test). Tidak boleh KPI/menu palsu atau simulasi bayar sukses. Dokumentasikan risiko manual-acceptance, static checks saja, checkpoint, lanjut M06.


---

## MODUL M06 PEMBAYARAN

# MODUL M06 — PEMBAYARAN LANJUTAN, SPLIT PAYMENT, RETUR, REFUND, REKONSILIASI

Periksa bahwa jalur POS dan stok sudah diimplementasikan. Lengkapi tanpa memecahkan kontrak API, state transition, dan posting ledger yang ada.

## Alur pembayaran

- Tambahkan penyelesaian multi-metode dengan split payment, nominal tervalidasi, larangan overpayment tidak beralasan, serta refund dengan rekam audit.
- Metode tunai, transfer manual diverifikasi, dan pembayaran QRIS/gateway hanya jika terverifikasi sah oleh server/provider; kondisi pending/failed/cancelled/expired harus eksplisit. Jika belum ada kredensial, implementasikan boundary adapter & status `BLOCKED_EXTERNAL`, jangan memalsukan keberhasilan.
- Idempotency untuk finalisasi dan penerimaan event, verifikasi jumlah/merchant/referensi eksternal bila integrasi tersedia. Jangan expose provider secret pada klien.
- Pisahkan `mutasi_kas` uang fisik dari pembayaran non-tunai; perhitungan buka/tutup kas harus tetap benar. Buat workflow rekonsiliasi bila pembayaran non-tunai memerlukan verifikasi manual.

## Retur, refund, stok

- Implementasikan `retur_jual`, `item_retur`, `refund_bayar` lengkap dengan status & aturan izin; tidak boleh retur lebih banyak dari kuantitas bersih terjual; tidak boleh refund lebih besar daripada nilai yang benar-benar dapat direfund.
- Untuk retur layak jual: kembalikan qty ke lot yang tepat bila dapat ditelusuri/valid, catat mutasi stok & nilai HPP kebalikan. Retur tidak layak jual: jangan menaikkan stok tersedia; catat kerugian/keputusan disposal dengan ledger yang sesuai.
- Jangan hard-delete penjualan selesai; pertahankan snapshot harga/HPP, hasil retur parsial/penuh tercatat dan terhitung benar dalam laporan.

## UI/API

- Detail penjualan & proses retur parsial dengan alasan, item/qty, keputusan layak jual; ringkasan refund, status pembayaran, bukti manual, log verifikasi dan riwayat.
- Keranjang split payment dan modal konfirmasi tindakan yang membutuhkan izin. Skeleton per transaction detail, spinner pada submit, konflik 409 dan validasi field 422.

## Gate

Transaksi idempotent, retur dan refund terlacak, split pembayaran tidak merusak nilai omzet/kas/stok, payment pending tidak disalahartikan sukses. Static checks, update docs + checkpoint, lanjut M07.


---

## MODUL M07 LAPORAN

# MODUL M07 — DASHBOARD, ANALITIK, LAPORAN TABEL, EXCEL, PDF

**JANGAN MENGARANG DATA DASHBOARD.** Semua angka harus berasal dari tabel transaksi yang sudah diposting serta query/filter yang didefinisikan dalam blueprint.

## Backend reporting services

- `DashboardService`, `LaporanPenjualanService`, `LaporanStokService`, `LaporanPembelianService`, `LaporanKeuanganService`, `EksporLaporanService` (nama sesuai style proyek).
- Sumber metrik: omzet bersih setelah retur, total transaksi selesai, margin kotor = omzet non-tax - HPP bersih, laba operasional setelah biaya & susut tanpa double count, stok lot × HPP, stok minimum, barang terlaris, susut, penerimaan, payment reconciliation dan selisih kas.
- Uraikan definisi KPI dan cutoff tanggal dengan zona waktu cabang; filter waktu di PostgreSQL berbasis rentang UTC yang benar. Exclude draft, pending, cancel, dan count retur secara konsisten.
- Optimalkan query: indeks relevan, pagination server-side, agregat akurat, query scopes berdasarkan cabang/role, tidak membuat N+1. Jika caching, tetapkan invalidasi dan jangan tampilkan cache basi sebagai data final tanpa penanda.

## REST API & export

- `/api/v1/dashboard/...`, `/api/v1/laporan/penjualan`, `.../stok`, `.../pembelian`, `.../laba-rugi`, `.../susut`, `.../kas`, detail item + filter dan pagination.
- Export CSV/XLSX/PDF melalui Laravel Job/Queue jika dataset berat. Filter data dan definisi angka **harus sama** antara dashboard, tabel, dan export; berikan metadata periode, cabang, IDR, waktu generate. Status pekerjaan dan tautan aman berumur terbatas.
- Wajib cek akses eksportir terhadap cabang/jenis laporan saat request dan download; hindari CSV formula injection saat ekspor dari data tak tepercaya.

## Frontend

- KPI cards rapat, grafik tren Recharts, penjualan kategori/top produk, stok kritis, susut dan ringkasan kas. Filter tanggal/periode, cabang, kasir, kategori, produk, payment method, status, tabel rincian dan drilldown.
- Skeleton per angka, legend, axis/chart, tabel row/cell dan filter saat fetch, bukan spinner penuh; submit export menampilkan spinner sederhana dan job status.
- Format rupiah `Rp` Indonesia, zona waktu jelas, definisi laporan di tooltip/help text yang mudah dimengerti pemilik non-teknis, empty states tanpa fake demo angka.
- UI tetap visual reference + Antislop dan **top navbar desktop / sidebar mobile**.

## Gate

Seluruh laporan inti mempunyai endpoint + halaman + export yang beroperasi pada source data sama; rumus dijelaskan. Tidak mengeklaim telah memverifikasi angka melalui testing manusia. Static checks; dokumentasikan cara developer membandingkan tiga format laporan. Update checkpoint dan lanjut M08.


---

## MODUL M08 HARDENING

# MODUL M08 — SECURITY HARDENING, RELIABILITY, PERFORMANCE, OPERASIONAL

Kerjakan implementasi sistem, bukan penetration testing, bukan browser testing. Jangan menjalankan tes aplikasi karena pengujian dimiliki developer manusia.

## Security dan reliability code

- Telaah seluruh API/controller/service terhadap OWASP API Top 10: BOLA/IDOR, broken function authorization, auth/session, input filtering, mass assignment, abuse/rate limiting, sensitive data exposure, unsafe file upload.
- Pastikan Policies scope cabang, CSRF/cookie security, session rotation, password hashing kuat, MFA admin jika mendukung; HTTP security headers/CSP wajar, CORS whitelist, safe errors, secrets hanya di environment/server.
- Idempotency, row locking, transaction boundaries, retry behavior dan status concurrency untuk POS, stok, penerimaan, refund; jangan pakai transaksi database panjang yang melingkupi network call provider.
- Audit perubahan harga, role, stok, retur, refund; log structured tanpa password/token/PII berlebihan. Correlation/request ID dan observability.
- Optimasi indeks/query, eager loading, pagination, API response size, queue retries/timeouts/dead-letter visibility, download report signed & authorized.

## Infrastructure readiness

- Buat konfigurasi deployment produksi aman (contoh env vars tanpa secrets), health/readiness strategy, queue worker, scheduler, log rotation, backup/restore documentation, dan instruksi monitoring.
- Buat skrip backup hanya jika tidak berisiko mengakses database real tanpa izin; **jangan menjalankan operasi backup/restore yang dapat mengubah data produksi**. Jangan mencetak secrets pada output.
- Siapkan konfigurasi skalabilitas modular monolith dan multi-cabang; tidak perlu microservice. Catat risiko Redis/worker/provider yang belum tersedia.

## Quality

- Boleh PHP syntax check, Composer autoload check, TypeScript checking, linting, Vite build. **Tidak** menjalankan PHPUnit, Pest, Cypress, Playwright, browser automation, manual testing atau membuat tes baru.
- Review kesesuaian UI per kode/gambar referensi tanpa menjalankan tes browser; kontrol responsive CSS dan skeleton kecil.
- Buat `docs/HANDOVER_DEVELOPER.md`: daftar manual acceptance yang developer perlu uji (berat 275g, stok paralel, refund, shift, laporan vs export, route permissions, responsive).

## Gate

Static checks yang mungkin telah dilalui atau keterbatasannya jelas, masalah security code yang ditemukan diperbaiki atau dicatat, deployment instructions dan checklist developer ada, progress diperbarui. Lanjut M09.


---

## MODUL M09 EKSPANSI

# MODUL M09 — FITUR EKSPANSI BLUEPRINT & FINAL INTEGRATION HANDOVER

Implementasikan fitur fase lanjutan di blueprint yang masih bisa dibangun dari repo saat ini. Jangan menghalangi penyelesaian core demi provider eksternal yang belum siap.

## Perluasan kemampuan

1. **Multi-cabang:** transfer stok dua tahap (keluar → dalam perjalanan → diterima), referensi antar cabang, audit dan penanganan selisih; seluruh dashboard/role/filter tidak bocor lintas cabang.
2. **Promosi:** aturan diskon per produk/kategori/periode, harga grosir, batas diskon dan approval; hindari double diskon, jaga snapshot saat penjualan.
3. **Loyalitas:** riwayat pelanggan, poin/benefit jika ditentukan, expiry dan audit; hindari mengubah transaksi historis.
4. **Hutang pemasok:** catatan tagihan penerimaan, pembayaran pemasok, outstanding, dan rekonsiliasi yang konsisten. Jangan mengaku full double-entry accounting bila tidak diminta/dibangun.
5. **Integrasi:** abstraksi adapter untuk payment gateway QRIS, scanner barcode, printer thermal, timbangan; jika credentials/hardware tidak ada, tulis kontrak dan status `BLOCKED_EXTERNAL` secara jujur, jangan memberi UI seolah aktif.
6. **Forecast sederhana:** rekomendasi restok berbasis data historis aktual jika cukup; bila belum ada data, tampilkan empty state dan penjelasan. Jangan menjanjikan prediksi AI akurat tanpa evaluasi.
7. **Notifications/exports:** antrean informasi stok minim, job export, status gagal/sukses, akses download aman bila belum terpenuhi.

## Integrasi akhir

- Periksa semua menu blueprint memiliki implementasi atau status `BLOCKED_EXTERNAL` beralasan. Pastikan tidak ada tautan menu mati berlabel aktif, mock API produksi, angka fiktif, atau placeholder tanpa label.
- Rapikan import/file yang obsolete hanya setelah verifikasi referensi statis. Jangan hapus blueprint, rules, maupun dokumen progres.
- Hasilkan `docs/HANDOVER_DEVELOPER.md` final: setup/env, migrasi yang perlu developer jalankan, vendor integration prerequisites, daftar endpoint, struktur file, matrix permission, manual acceptance checklist, static checks, known risks, urutan go-live.
- Static checks allowed, **testing tetap khusus developer**. Bila dependency tool tidak tersedia, catat yang tidak bisa diverifikasi.

## Kriteria akhir

Tandai setiap modul `SELESAI_IMPLEMENTASI` hanya jika file dan interaksi nyata sudah ada; modul/vendor yang belum dapat dipasang karena kredensial/hardware sebagai `BLOCKED_EXTERNAL`, jangan mengklaim selesai 100%. Buat ringkasan tegas: implemented, partially implemented, externally blocked, not tested by agent. Jangan melakukan commit/push/deploy produksi tanpa perintah user.


---

## RESUME

# RESUME PROMPT — LANJUTKAN DEVELOPMENT KETIKA TOKEN/SESI HABIS

**JANGAN MEMULAI PROYEK DARI NOL. JANGAN MENGULANG MODUL SECARA MEMBABI BUTA. LANGSUNG LANJUTKAN PEKERJAAN.**

Anda adalah coding agent pengganti yang bekerja di workspace **`kebun-kita-POS` yang sama**. Anggap percakapan sebelumnya tidak tersedia. Sumber kebenaran satu-satunya adalah **file di workspace, blueprint, dan state kode yang benar-benar ada**.

## Langkah resume WAJIB, berurutan

1. Baca `CLAUDE.md`/`AGENTS.md`, `KEBUN_KITA_IMPLEMENTATION_BLUEPRINT.md`, dan `prompts/00_MASTER_MULAI_OTOMATIS.md`. Baca `docs/PROGRES_PENGEMBANGAN.md`, `docs/KEPUTUSAN_TEKNIS.md`, dokumen kontrak bisnis, serta prompt modul yang sedang `BERJALAN`.
2. Inspeksi `git status --short` bila Git ada, struktur direktori, file yang terakhir diubah, migration, route API, Services, components dan halaman relevan; **verifikasi checkpoint vs fakta kode**, karena agent lama bisa terputus di tengah penulisan file. Bila ketidakcocokan, prioritaskan bukti file dan perbaiki catatan.
3. Tentukan *vertical slice terkecil yang belum lengkap*, mis. `penerimaan parsial: migration sudah ada, service sudah ada, API Resource belum, frontend belum`. Tuliskan langkah konkret; jangan menghabiskan sesi membuat plan baru.
4. Temukan dan baca skill Antislop jika mengerjakan UI. Gunakan gambar `referensi/desain-pos-kebun-kita.png` jika tersedia.
5. **LANGSUNG EDIT KODE** untuk menyelesaikan potongan tertinggal dari titik tersebut. Jangan scaffold ulang, jangan membuat migration duplikat, jangan mereplace service yang sudah benar, jangan reset database, jangan overwrite developer edits.
6. Setelah setiap vertical slice: review perubahan, lakukan static checks yang tersedia (TypeScript/lint/build/PHP lint), **tanpa** unit/integration/E2E/browser/manual tests, lalu perbarui `docs/PROGRES_PENGEMBANGAN.md`.
7. Setelah modul selesai secara implementasi, pindah ke modul berikutnya secara otomatis mengikuti urutan M00→M09. Saat konteks kembali sempit, checkpoint dulu sebelum mengakhiri sesi.

## Aturan tidak boleh dilanggar

- Laravel + Service Layer + PostgreSQL + React TypeScript REST API `/api/v1`; IDR dengan presisi; ledger FEFO/HPP; RBAC/cabang; Sanctum + CSRF; idempotency dan stok concurrency.
- UI white/mint/emerald gambar referensi, card gap 6–8px, **desktop top navbar / mobile sidebar drawer**; skeleton granular fetch, spinner sederhana tombol submit.
- Test aplikasi **HANYA oleh developer manusia**; agent **BOLEH** static lint/typecheck/build, tidak boleh menjalankan functional/E2E/manual tests.
- Tidak boleh mengarang laporan bahwa module/proyek selesai. Catat blocker eksternal; lanjut kode yang tidak bergantung pada blocker.

## Output singkat saat handoff berikutnya

`MODUL | checkpoint terakhir | file yang benar-benar diubah | hasil static check | next vertical slice | risiko/blocker`. **EKSEKUSI SEKARANG, JANGAN MENUNGGU IZIN LANJUTAN.**


---

## RECOVERY

# RECOVERY PROMPT — JIKA CHECKPOINT HILANG / PROGRES TIDAK AKURAT

TUGAS ANDA MEMULIHKAN KONTEKS DARI FAKTA REPOSITORY, BUKAN MENGULANG DEVELOPMENT DARI NOL.

1. Baca blueprint root, `CLAUDE.md`/`AGENTS.md`, prompt master dan direktori prompts. Temukan skill Antislop bila bekerja pada UI.
2. Inspeksi filesystem, `git status`, `git diff --stat`, konfigurasi Laravel/npm, migrations, model, service, policies, routes, TSX pages, CSS tokens dan docs. `git` mungkin belum diinisialisasi; jangan menganggap kegagalan `git status` berarti kode hilang.
3. Buat inventaris singkat modul M00–M09: `sudah ada dan konsisten`, `parsial`, `belum`, `blocked external` dengan **bukti nama file**, bukan klaim.
4. Pulihkan / koreksi `docs/PROGRES_PENGEMBANGAN.md`, simpan daftar tugas kecil dan file penting yang harus diselesaikan berikutnya.
5. Jangan menghapus, reset, reinitialize Laravel, rerun migration produksi, atau menimpa perubahan user. Jangan menjalankan application tests.
6. Prioritaskan modul terawal yang parsial dan dependensinya, lalu **langsung implementasikan vertical slice berikutnya** sesuai prompt modul, tanpa berhenti untuk laporan panjang.
7. Setelah perubahan, static checks yang tersedia dan update checkpoint. Jika ada kerusakan kode karena penghentian mendadak, perbaiki hanya file terdampak berdasarkan kontrak blueprint.

**MULAI PEMULIHAN DAN LANJUTKAN DEVELOPMENT SEKARANG.**
