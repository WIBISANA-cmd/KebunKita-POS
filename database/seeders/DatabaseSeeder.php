<?php

namespace Database\Seeders;

use App\Models\AlokasiJualLot;
use App\Models\BayarJual;
use App\Models\Cabang;
use App\Models\DokumenStok;
use App\Models\HargaProduk;
use App\Models\ItemJual;
use App\Models\KategoriProduk;
use App\Models\LokasiStok;
use App\Models\LotStok;
use App\Models\MetodeBayar;
use App\Models\MutasiKas;
use App\Models\MutasiStok;
use App\Models\Pelanggan;
use App\Models\Pemasok;
use App\Models\PengaturanToko;
use App\Models\Pengguna;
use App\Models\Penjualan;
use App\Models\Peran;
use App\Models\Produk;
use App\Models\SaldoStok;
use App\Models\Satuan;
use App\Models\SatuanProduk;
use App\Models\ShiftKasir;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // =========================================================================
        // 1. CABANG TOKO (MULTI-STORE)
        // =========================================================================
        $cabangUtama = Cabang::firstOrCreate(
            ['kode' => 'KBY-01'],
            [
                'nama' => 'Kebun Kita - Cabang Utama Kotabaru',
                'alamat' => 'Jl. Wardhani No. 12, Kotabaru, Gondokusuman, Kota Yogyakarta 55224',
                'telepon' => '0274-551234',
                'aktif' => true,
            ]
        );

        $cabangSleman = Cabang::firstOrCreate(
            ['kode' => 'SLM-02'],
            [
                'nama' => 'Kebun Kita - Cabang Kaliurang Sleman',
                'alamat' => 'Jl. Kaliurang Km 8.5, Sinduharjo, Ngaglik, Sleman, D.I. Yogyakarta 55581',
                'telepon' => '0274-884321',
                'aktif' => true,
            ]
        );

        $cabangSeturan = Cabang::firstOrCreate(
            ['kode' => 'STR-03'],
            [
                'nama' => 'Kebun Kita - Cabang Seturan Depok',
                'alamat' => 'Jl. Seturan Raya No. 88, Caturtunggal, Depok, Sleman 55281',
                'telepon' => '0274-489912',
                'aktif' => true,
            ]
        );

        // =========================================================================
        // 2. PERAN (RBAC)
        // =========================================================================
        $peranPemilik = Peran::firstOrCreate(
            ['kode' => 'pemilik'],
            [
                'nama' => 'Pemilik Toko (Super Admin)',
                'deskripsi' => 'Akses menyeluruh seluruh cabang, analitik omzet, dan laporan keuangan komprehensif',
            ]
        );

        $peranManajer = Peran::firstOrCreate(
            ['kode' => 'manajer'],
            [
                'nama' => 'Manajer Operasional Toko',
                'deskripsi' => 'Supervisi operasional harian cabang, penetapan harga, dan approval stok',
            ]
        );

        $peranKasir = Peran::firstOrCreate(
            ['kode' => 'kasir'],
            [
                'nama' => 'Kasir Toko',
                'deskripsi' => 'Operasional shift kasir, transaksi POS, timbangan sayur, dan cetak struk kasir',
            ]
        );

        $peranGudang = Peran::firstOrCreate(
            ['kode' => 'gudang'],
            [
                'nama' => 'Supervisor Gudang & Pembelian',
                'deskripsi' => 'Pengadaan PO, penerimaan barang, FEFO lot, opname & pemilahan susut',
            ]
        );

        // =========================================================================
        // 3. PENGGUNA TOKO (STAFF & KREDENSIAL)
        // =========================================================================
        $pemilik = Pengguna::firstOrCreate(
            ['email' => 'pemilik@kebunkita.id'],
            [
                'cabang_id' => $cabangUtama->id,
                'nama' => 'Budi Santoso',
                'telepon' => '081234567001',
                'password' => $this->kataSandiAwal('SEED_PASSWORD_PEMILIK', 'AdminKebunKita2026!'),
                'aktif' => true,
            ]
        );
        $pemilik->peran()->syncWithoutDetaching([$peranPemilik->id => ['cabang_id' => $cabangUtama->id]]);

        $manajer = Pengguna::firstOrCreate(
            ['email' => 'manajer@kebunkita.id'],
            [
                'cabang_id' => $cabangUtama->id,
                'nama' => 'Hendra Wijaya',
                'telepon' => '081234567002',
                'password' => $this->kataSandiAwal('SEED_PASSWORD_STAF', 'ManajerKebunKita2026!'),
                'aktif' => true,
            ]
        );
        $manajer->peran()->syncWithoutDetaching([$peranManajer->id => ['cabang_id' => $cabangUtama->id]]);

        $kasir1 = Pengguna::firstOrCreate(
            ['email' => 'kasir@kebunkita.id'],
            [
                'cabang_id' => $cabangUtama->id,
                'nama' => 'Siti Nurhaliza',
                'telepon' => '081234567003',
                'password' => $this->kataSandiAwal('SEED_PASSWORD_STAF', 'KasirKebunKita2026!'),
                'aktif' => true,
            ]
        );
        $kasir1->peran()->syncWithoutDetaching([$peranKasir->id => ['cabang_id' => $cabangUtama->id]]);

        $kasir2 = Pengguna::firstOrCreate(
            ['email' => 'kasir2@kebunkita.id'],
            [
                'cabang_id' => $cabangSleman->id,
                'nama' => 'Rina Anggraini',
                'telepon' => '081234567004',
                'password' => $this->kataSandiAwal('SEED_PASSWORD_STAF', 'KasirKebunKita2026!'),
                'aktif' => true,
            ]
        );
        $kasir2->peran()->syncWithoutDetaching([$peranKasir->id => ['cabang_id' => $cabangSleman->id]]);

        $gudang = Pengguna::firstOrCreate(
            ['email' => 'gudang@kebunkita.id'],
            [
                'cabang_id' => $cabangUtama->id,
                'nama' => 'Joko Prasetyo',
                'telepon' => '081234567005',
                'password' => $this->kataSandiAwal('SEED_PASSWORD_STAF', 'GudangKebunKita2026!'),
                'aktif' => true,
            ]
        );
        $gudang->peran()->syncWithoutDetaching([$peranGudang->id => ['cabang_id' => $cabangUtama->id]]);

        // =========================================================================
        // 4. METODE PEMBAYARAN
        // =========================================================================
        $metodeTunai = MetodeBayar::firstOrCreate(['kode' => 'TUNAI'], ['nama' => 'Uang Tunai (Cash)', 'jenis' => 'tunai', 'aktif' => true]);
        $metodeQris = MetodeBayar::firstOrCreate(['kode' => 'QRIS'], ['nama' => 'QRIS Dinamis / Statis', 'jenis' => 'qris', 'aktif' => true]);
        $metodeEdcBca = MetodeBayar::firstOrCreate(['kode' => 'EDC-BCA'], ['nama' => 'Debit / Kartu BCA (EDC)', 'jenis' => 'kartu', 'aktif' => true]);
        $metodeEdcMandiri = MetodeBayar::firstOrCreate(['kode' => 'EDC-MANDIRI'], ['nama' => 'Debit / Kartu Mandiri (EDC)', 'jenis' => 'kartu', 'aktif' => true]);
        $metodeTrfBca = MetodeBayar::firstOrCreate(['kode' => 'TRF-BCA'], ['nama' => 'Transfer Bank BCA', 'jenis' => 'transfer', 'aktif' => true]);

        // =========================================================================
        // 5. LOKASI PENYIMPANAN STOK
        // =========================================================================
        $lokasiTokoUtama = LokasiStok::firstOrCreate(
            ['cabang_id' => $cabangUtama->id, 'kode' => 'TOKO-UTAMA'],
            ['nama' => 'Rak Penjualan Kasir Kotabaru', 'tipe' => 'rak_toko']
        );

        $lokasiGudangUtama = LokasiStok::firstOrCreate(
            ['cabang_id' => $cabangUtama->id, 'kode' => 'GDG-UTAMA'],
            ['nama' => 'Cold Storage / Gudang Utama Kotabaru', 'tipe' => 'gudang']
        );

        $lokasiTokoSleman = LokasiStok::firstOrCreate(
            ['cabang_id' => $cabangSleman->id, 'kode' => 'TOKO-SLM'],
            ['nama' => 'Rak Penjualan Kasir Sleman', 'tipe' => 'rak_toko']
        );

        $lokasiTokoSeturan = LokasiStok::firstOrCreate(
            ['cabang_id' => $cabangSeturan->id, 'kode' => 'TOKO-STR'],
            ['nama' => 'Rak Penjualan Kasir Seturan', 'tipe' => 'rak_toko']
        );

        // =========================================================================
        // 6. SATUAN PENGUKURAN
        // =========================================================================
        $satuanKg = Satuan::firstOrCreate(['kode' => 'kg'], ['nama' => 'Kilogram', 'jenis' => 'berat']);
        $satuanGram = Satuan::firstOrCreate(['kode' => 'g'], ['nama' => 'Gram', 'jenis' => 'berat']);
        $satuanIkat = Satuan::firstOrCreate(['kode' => 'ikt'], ['nama' => 'Ikat Segar', 'jenis' => 'cacah']);
        $satuanPcs = Satuan::firstOrCreate(['kode' => 'pcs'], ['nama' => 'Pcs / Butir', 'jenis' => 'cacah']);
        $satuanPack = Satuan::firstOrCreate(['kode' => 'pck'], ['nama' => 'Pack Segar', 'jenis' => 'kemasan']);
        $satuanBtl = Satuan::firstOrCreate(['kode' => 'btl'], ['nama' => 'Botol Kaca', 'jenis' => 'kemasan']);
        $satuanBox = Satuan::firstOrCreate(['kode' => 'box'], ['nama' => 'Tray / Kotak', 'jenis' => 'kemasan']);

        // =========================================================================
        // 7. KATEGORI PRODUK
        // =========================================================================
        $katDaun = KategoriProduk::firstOrCreate(['nama' => 'Sayuran Daun'], ['urutan' => 1, 'aktif' => true]);
        $katBuahSayur = KategoriProduk::firstOrCreate(['nama' => 'Sayuran Buah'], ['urutan' => 2, 'aktif' => true]);
        $katUmbi = KategoriProduk::firstOrCreate(['nama' => 'Umbi & Rimpang'], ['urutan' => 3, 'aktif' => true]);
        $katBumbu = KategoriProduk::firstOrCreate(['nama' => 'Bumbu Dapur'], ['urutan' => 4, 'aktif' => true]);
        $katBuah = KategoriProduk::firstOrCreate(['nama' => 'Buah Segar'], ['urutan' => 5, 'aktif' => true]);
        $katJamur = KategoriProduk::firstOrCreate(['nama' => 'Jamur & Organik'], ['urutan' => 6, 'aktif' => true]);
        $katKebun = KategoriProduk::firstOrCreate(['nama' => 'Produk Khusus Kebun'], ['urutan' => 7, 'aktif' => true]);

        // =========================================================================
        // 8. DOKUMEN SALDO AWAL (LEDGER MUTASI INDUK)
        // =========================================================================
        $dokumenInit = DokumenStok::firstOrCreate(
            ['nomor' => 'DOK-INIT-MASTER'],
            [
                'cabang_id' => $cabangUtama->id,
                'jenis' => 'penerimaan_beli',
                'referensi_id' => 'INIT-SYSTEM-MASTER',
                'waktu_posting' => now()->subDays(30),
            ]
        );

        // =========================================================================
        // 12. PENGATURAN TOKO
        // =========================================================================
        PengaturanToko::updateOrCreate(
            ['cabang_id' => null, 'kunci' => 'toko_profil'],
            [
                'nilai_json' => [
                    'nama' => 'Kebun Kita Fresh Market',
                    'tagline' => 'Segar Setiap Hari Langsung dari Petani Mitra',
                    'telepon' => '0274-551234',
                    'alamat' => 'Jl. Wardhani No. 12, Kotabaru, Gondokusuman, Yogyakarta',
                    'footer_struk' => 'Terima kasih telah berbelanja produk segar lokal di Kebun Kita!\nBarang yang sudah dibeli dapat ditukar 1x24 jam dengan membawa struk.',
                ],
            ]
        );

        PengaturanToko::updateOrCreate(
            ['cabang_id' => null, 'kunci' => 'pos_kebijakan'],
            [
                'nilai_json' => [
                    'ppn_persen' => 0,
                    'aktifkan_diskon_kasir' => true,
                    'maksimal_diskon_persen' => 20,
                    'cetak_otomatis_struk' => true,
                    'tampilkan_qris_dinamis' => true,
                ],
            ]
        );

        if (! filter_var(env('SEED_DATA_DEMO', true), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        // =========================================================================
        // 9. MASTER PRODUK LENGKAP & FOTO ASLI (36+ PRODUK SEGAR)
        // =========================================================================
        $katalogLengkap = [
            // Sayuran Daun
            [
                'kategori' => $katDaun,
                'satuan_dasar' => $satuanIkat,
                'sku' => 'SYN-BYM-01',
                'nama' => 'Bayam Hijau Organik',
                'deskripsi' => 'Bayam hijau segar kaya zat besi langsung dipetik pagi hari dari lereng Gunung Merapi.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
                'harga' => '4500',
                'satuan_jual' => $satuanIkat,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '65.000',
                'hpp' => '2800.000000',
                'expired_days' => 7,
            ],
            [
                'kategori' => $katDaun,
                'satuan_dasar' => $satuanIkat,
                'sku' => 'SYN-KKG-02',
                'nama' => 'Kangkung Hidroponik Akar',
                'deskripsi' => 'Kangkung segar dengan akar higienis, renyah dan bebas pestisida kimia.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
                'harga' => '5000',
                'satuan_jual' => $satuanIkat,
                'faktor' => '1.000000',
                'stok_min' => '15.000',
                'stok_awal' => '80.000',
                'hpp' => '3200.000000',
                'expired_days' => 8,
            ],
            [
                'kategori' => $katDaun,
                'satuan_dasar' => $satuanKg,
                'sku' => 'SYN-SWI-03',
                'nama' => 'Sawi Daging / Pakcoy Hijau',
                'deskripsi' => 'Pakcoy segar batang tebal dan renyah, sangat cocok untuk tumisan dan sup.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=400&q=80',
                'harga' => '14000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '55.000',
                'hpp' => '9200.000000',
                'expired_days' => 9,
            ],
            [
                'kategori' => $katDaun,
                'satuan_dasar' => $satuanKg,
                'sku' => 'SYN-SLD-04',
                'nama' => 'Selada Keriting Hijau Segar',
                'deskripsi' => 'Selada keriting segar krispi untuk lalapan, burger, dan salad segar.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80',
                'harga' => '22000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '4.000',
                'stok_awal' => '40.000',
                'hpp' => '14500.000000',
                'expired_days' => 6,
            ],
            [
                'kategori' => $katDaun,
                'satuan_dasar' => $satuanPack,
                'sku' => 'SYN-RMN-05',
                'nama' => 'Selada Romaine Hidroponik (200g)',
                'deskripsi' => 'Romaine lettuce premium, renyah manis untuk Caesar Salad berkualitas.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=400&q=80',
                'harga' => '15000',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '45.000',
                'hpp' => '9500.000000',
                'expired_days' => 10,
            ],
            [
                'kategori' => $katDaun,
                'satuan_dasar' => $satuanPack,
                'sku' => 'SYN-HRN-06',
                'nama' => 'Horenso / Bayam Jepang Premium',
                'deskripsi' => 'Bayam jepang berdaun lembut tebal, kaya antioksidan dan klorofil.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
                'harga' => '16500',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '6.000',
                'stok_awal' => '35.000',
                'hpp' => '11000.000000',
                'expired_days' => 8,
            ],

            // Sayuran Buah
            [
                'kategori' => $katBuahSayur,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-TMT-01',
                'nama' => 'Tomat Merah Segar Pilihan',
                'deskripsi' => 'Tomat sayur merah cerah padat berisi, manis asam segar untuk masakan.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
                'harga' => '16000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '70.000',
                'hpp' => '10500.000000',
                'expired_days' => 14,
            ],
            [
                'kategori' => $katBuahSayur,
                'satuan_dasar' => $satuanPack,
                'sku' => 'BHS-TMC-02',
                'nama' => 'Tomat Cherry Manis Organik (250g)',
                'deskripsi' => 'Tomat ceri bulat kecil manis segar, lezat dimakan langsung atau salad.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=400&q=80',
                'harga' => '18000',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '40.000',
                'hpp' => '12000.000000',
                'expired_days' => 12,
            ],
            [
                'kategori' => $katBuahSayur,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-KYR-03',
                'nama' => 'Timun Jepang / Kyuri Segar',
                'deskripsi' => 'Timun jepang berkulit gelap padat dengan biji sedikit, ekstra renyah.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80',
                'harga' => '15000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '50.000',
                'hpp' => '9800.000000',
                'expired_days' => 12,
            ],
            [
                'kategori' => $katBuahSayur,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-TRG-04',
                'nama' => 'Terong Ungu Panjang Segar',
                'deskripsi' => 'Terong ungu mengkilap tanpa cacat, daging lembut tidak pahit.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80',
                'harga' => '12000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '6.000',
                'stok_awal' => '45.000',
                'hpp' => '7500.000000',
                'expired_days' => 10,
            ],
            [
                'kategori' => $katBuahSayur,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-BRK-05',
                'nama' => 'Brokoli Hijau Dataran Tinggi',
                'deskripsi' => 'Brokoli segar kuntum rapat hijau pekat dari kebun pegunungan Dieng.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80',
                'harga' => '32000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '40.000',
                'hpp' => '22000.000000',
                'expired_days' => 9,
            ],
            [
                'kategori' => $katBuahSayur,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-JGM-06',
                'nama' => 'Jagung Manis Madu Kupas',
                'deskripsi' => 'Jagung manis kuning mengkilap rasa manis alami, butiran padat.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
                'harga' => '11000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '60.000',
                'hpp' => '7000.000000',
                'expired_days' => 14,
            ],

            // Umbi & Rimpang
            [
                'kategori' => $katUmbi,
                'satuan_dasar' => $satuanKg,
                'sku' => 'UMB-WRT-01',
                'nama' => 'Wortel Brastagi Manis Super',
                'deskripsi' => 'Wortel oranye cerah segar kualitas ekspor, manis dan renyah berair.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=400&q=80',
                'harga' => '18000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '60.000',
                'hpp' => '12000.000000',
                'expired_days' => 20,
            ],
            [
                'kategori' => $katUmbi,
                'satuan_dasar' => $satuanKg,
                'sku' => 'UMB-KTG-02',
                'nama' => 'Kentang Dieng Granola Pilihan',
                'deskripsi' => 'Kentang dataran tinggi Dieng kulit bersih, pulen untuk perkedel dan sup.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
                'harga' => '24000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '75.000',
                'hpp' => '16500.000000',
                'expired_days' => 30,
            ],
            [
                'kategori' => $katUmbi,
                'satuan_dasar' => $satuanKg,
                'sku' => 'UMB-JHM-03',
                'nama' => 'Jahe Merah Segar Wangi',
                'deskripsi' => 'Rimpang jahe merah tua pedas mantap berkhasiat herbal stamina tubuh.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
                'harga' => '35000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '35.000',
                'hpp' => '24000.000000',
                'expired_days' => 30,
            ],
            [
                'kategori' => $katUmbi,
                'satuan_dasar' => $satuanKg,
                'sku' => 'UMB-UBI-04',
                'nama' => 'Ubi Madu Cilembu Matang Madu',
                'deskripsi' => 'Ubi manis Cilembu asli, legit beraroma karamel saat dipanggang.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
                'harga' => '16000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '50.000',
                'hpp' => '10500.000000',
                'expired_days' => 25,
            ],

            // Bumbu Dapur
            [
                'kategori' => $katBumbu,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BMB-CBI-01',
                'nama' => 'Cabai Rawit Merah Super',
                'deskripsi' => 'Cabai rawit merah petik segar pedas menyengat, bebas layu.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80',
                'harga' => '48000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '45.000',
                'hpp' => '36000.000000',
                'expired_days' => 14,
            ],
            [
                'kategori' => $katBumbu,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BMB-CMK-02',
                'nama' => 'Cabai Merah Keriting Petik',
                'deskripsi' => 'Cabai merah keriting segar, menghasilkan warna merah memikat pada masakan.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80',
                'harga' => '42000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '40.000',
                'hpp' => '31000.000000',
                'expired_days' => 14,
            ],
            [
                'kategori' => $katBumbu,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BMB-BMR-03',
                'nama' => 'Bawang Merah Brebes Pilihan',
                'deskripsi' => 'Bawang merah kering simpan tahan lama, wangi gurih sedap.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
                'harga' => '38000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '65.000',
                'hpp' => '27000.000000',
                'expired_days' => 30,
            ],
            [
                'kategori' => $katBumbu,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BMB-BAP-04',
                'nama' => 'Bawang Putih Kating Super',
                'deskripsi' => 'Bawang putih kating siung besar padat beraroma wangi kuat.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80',
                'harga' => '36000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '6.000',
                'stok_awal' => '50.000',
                'hpp' => '26000.000000',
                'expired_days' => 45,
            ],
            [
                'kategori' => $katBumbu,
                'satuan_dasar' => $satuanIkat,
                'sku' => 'BMB-DBW-05',
                'nama' => 'Daun Bawang Batang Gemuk',
                'deskripsi' => 'Daun bawang segar wangi lezat untuk pelengkap kuah dan martabak.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
                'harga' => '5000',
                'satuan_jual' => $satuanIkat,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '40.000',
                'hpp' => '3000.000000',
                'expired_days' => 8,
            ],

            // Buah Segar
            [
                'kategori' => $katBuah,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-PSG-01',
                'nama' => 'Pisang Cavendish Sunpride',
                'deskripsi' => 'Pisang cavendish manis lembut, kuning mulus tanpa getah.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
                'harga' => '24000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '60.000',
                'hpp' => '16500.000000',
                'expired_days' => 9,
            ],
            [
                'kategori' => $katBuah,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-ALP-02',
                'nama' => 'Alpukat Mentega Super Pulen',
                'deskripsi' => 'Alpukat mentega daging kuning tebal legit tanpa serat pahit.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80',
                'harga' => '38000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '50.000',
                'hpp' => '26000.000000',
                'expired_days' => 10,
            ],
            [
                'kategori' => $katBuah,
                'satuan_dasar' => $satuanPcs,
                'sku' => 'BHS-PPY-03',
                'nama' => 'Pepaya California Matang Pohon',
                'deskripsi' => 'Pepaya california merah oranye manis segar, kaya serat melancarkan cerna.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&q=80',
                'harga' => '18000',
                'satuan_jual' => $satuanPcs,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '35.000',
                'hpp' => '11500.000000',
                'expired_days' => 8,
            ],
            [
                'kategori' => $katBuah,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-JRK-04',
                'nama' => 'Jeruk Medan Manis Berair',
                'deskripsi' => 'Jeruk medan berkulit tipis manis segar dengan bulir sari buah melimpah.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
                'harga' => '28000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '60.000',
                'hpp' => '19000.000000',
                'expired_days' => 15,
            ],
            [
                'kategori' => $katBuah,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-NGA-05',
                'nama' => 'Buah Naga Merah Banyuwangi',
                'deskripsi' => 'Buah naga daging merah tua manis kaya antioksidan dan kesegaran.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&q=80',
                'harga' => '25000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '45.000',
                'hpp' => '17000.000000',
                'expired_days' => 12,
            ],
            [
                'kategori' => $katBuah,
                'satuan_dasar' => $satuanKg,
                'sku' => 'BHS-SMK-06',
                'nama' => 'Semangka Merah Non-Biji Manis',
                'deskripsi' => 'Semangka non biji renyah manis kaya air penghilang dahaga tropis.',
                'tipe_jual' => 'timbang',
                'foto_url' => 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80',
                'harga' => '12000',
                'satuan_jual' => $satuanKg,
                'faktor' => '1.000000',
                'stok_min' => '15.000',
                'stok_awal' => '80.000',
                'hpp' => '8000.000000',
                'expired_days' => 14,
            ],

            // Jamur & Organik
            [
                'kategori' => $katJamur,
                'satuan_dasar' => $satuanPack,
                'sku' => 'JMR-TRM-01',
                'nama' => 'Jamur Tiram Putih Segar (250g)',
                'deskripsi' => 'Jamur tiram budidaya bersih bebas ulat, kenyal lezat untuk digoreng krispi.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&q=80',
                'harga' => '7500',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '50.000',
                'hpp' => '4800.000000',
                'expired_days' => 7,
            ],
            [
                'kategori' => $katJamur,
                'satuan_dasar' => $satuanPack,
                'sku' => 'JMR-KNC-02',
                'nama' => 'Jamur Kancing / Champignon (200g)',
                'deskripsi' => 'Jamur kancing putih segar bulat mulus untuk pasta, steak, dan tumis oriental.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&q=80',
                'harga' => '16000',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '40.000',
                'hpp' => '11000.000000',
                'expired_days' => 8,
            ],
            [
                'kategori' => $katJamur,
                'satuan_dasar' => $satuanPack,
                'sku' => 'JMR-ENK-03',
                'nama' => 'Jamur Enoki Segar Higienis (100g)',
                'deskripsi' => 'Jamur enoki putih bersih renyah untuk shabu-shabu, suki, dan sup hangat.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&q=80',
                'harga' => '9000',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '10.000',
                'stok_awal' => '50.000',
                'hpp' => '6000.000000',
                'expired_days' => 14,
            ],

            // Produk Khusus Kebun
            [
                'kategori' => $katKebun,
                'satuan_dasar' => $satuanBtl,
                'sku' => 'KBK-MAD-01',
                'nama' => 'Madu Hutan Merapi Asli (250ml)',
                'deskripsi' => 'Madu lebah liar hutan lereng Merapi murni tanpa campuran gula dan pemanis.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
                'harga' => '65000',
                'satuan_jual' => $satuanBtl,
                'faktor' => '1.000000',
                'stok_min' => '5.000',
                'stok_awal' => '30.000',
                'hpp' => '45000.000000',
                'expired_days' => 180,
            ],
            [
                'kategori' => $katKebun,
                'satuan_dasar' => $satuanBox,
                'sku' => 'KBK-TLR-02',
                'nama' => 'Telur Ayam Kampung Herbal (Isi 6)',
                'deskripsi' => 'Telur ayam kampung pakan rempah herbal, kuning telur oranye bebas antibiotik.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&q=80',
                'harga' => '25000',
                'satuan_jual' => $satuanBox,
                'faktor' => '1.000000',
                'stok_min' => '8.000',
                'stok_awal' => '40.000',
                'hpp' => '18000.000000',
                'expired_days' => 25,
            ],
            [
                'kategori' => $katKebun,
                'satuan_dasar' => $satuanPack,
                'sku' => 'KBK-BRS-03',
                'nama' => 'Beras Pandan Wangi Organik (2.5 kg)',
                'deskripsi' => 'Beras organik aromatik wangi pandan alami tanpa pemutih dan tanpa pengawet.',
                'tipe_jual' => 'satuan',
                'foto_url' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
                'harga' => '48000',
                'satuan_jual' => $satuanPack,
                'faktor' => '1.000000',
                'stok_min' => '6.000',
                'stok_awal' => '35.000',
                'hpp' => '36000.000000',
                'expired_days' => 90,
            ],
        ];

        $daftarProdukId = [];
        $daftarSatuanProdukId = [];

        foreach ($katalogLengkap as $k) {
            $produk = Produk::updateOrCreate(
                ['sku' => $k['sku']],
                [
                    'kategori_produk_id' => $k['kategori']->id,
                    'satuan_dasar_id' => $k['satuan_dasar']->id,
                    'nama' => $k['nama'],
                    'deskripsi' => $k['deskripsi'],
                    'tipe_jual' => $k['tipe_jual'],
                    'foto_url' => $k['foto_url'],
                    'stok_minimum' => $k['stok_min'],
                    'aktif' => true,
                ]
            );

            $daftarProdukId[] = $produk;

            $satuanProduk = SatuanProduk::firstOrCreate(
                [
                    'produk_id' => $produk->id,
                    'satuan_id' => $k['satuan_jual']->id,
                ],
                [
                    'faktor_ke_dasar' => $k['faktor'],
                    'barcode' => null,
                    'bisa_dijual' => true,
                    'bisa_dibeli' => true,
                ]
            );

            $daftarSatuanProdukId[$produk->id] = $satuanProduk;

            HargaProduk::firstOrCreate(
                [
                    'satuan_produk_id' => $satuanProduk->id,
                    'cabang_id' => null, // Berlaku seluruh cabang
                    'jenis_harga' => 'reguler',
                ],
                [
                    'harga_rp' => $k['harga'],
                    'mulai_pada' => now()->subDays(60),
                    'akhir_pada' => null,
                ]
            );

            // Inisialisasi Lot Stok & Saldo Stok di Cabang Utama (Rak Penjualan)
            $lot = LotStok::firstOrCreate(
                [
                    'produk_id' => $produk->id,
                    'lokasi_stok_id' => $lokasiTokoUtama->id,
                    'kode_lot' => 'LOT-INIT-'.$k['sku'],
                ],
                [
                    'qty_awal' => $k['stok_awal'],
                    'qty_sisa' => $k['stok_awal'],
                    'hpp_dasar' => $k['hpp'],
                    'kedaluwarsa_pada' => now()->addDays($k['expired_days']),
                ]
            );

            // Perbarui / buat saldo stok terpelihara
            SaldoStok::firstOrCreate(
                [
                    'produk_id' => $produk->id,
                    'lokasi_stok_id' => $lokasiTokoUtama->id,
                ],
                [
                    'qty_dasar' => $k['stok_awal'],
                ]
            );

            // Catat ledger mutasi stok awal jika belum ada
            MutasiStok::firstOrCreate(
                [
                    'dokumen_stok_id' => $dokumenInit->id,
                    'produk_id' => $produk->id,
                    'lokasi_stok_id' => $lokasiTokoUtama->id,
                ],
                [
                    'lot_stok_id' => $lot->id,
                    'qty_delta' => $k['stok_awal'],
                    'nilai_hpp_rp' => (string) round((float) $k['stok_awal'] * (float) $k['hpp']),
                    'keterangan' => 'Stok awal inisialisasi master katalog Kebun Kita',
                ]
            );
        }

        // =========================================================================
        // 10. MITRA PEMASOK (SUPPLIERS)
        // =========================================================================
        Pemasok::firstOrCreate(
            ['nama' => 'Kelompok Tani Merapi Makmur'],
            [
                'kontak' => 'Pak Joko Subagyo',
                'telepon' => '081234567890',
                'alamat' => 'Dusun Kinahrejo, Cangkringan, Sleman, D.I. Yogyakarta',
                'aktif' => true,
            ]
        );

        Pemasok::firstOrCreate(
            ['nama' => 'Koperasi Hidroponik Kaliurang Sejahtera'],
            [
                'kontak' => 'Ibu Rahayu Hartati',
                'telepon' => '081398765432',
                'alamat' => 'Jl. Boyong Km 2, Pakem, Sleman, D.I. Yogyakarta',
                'aktif' => true,
            ]
        );

        Pemasok::firstOrCreate(
            ['nama' => 'Paguyuban Petani Organik Bantul Asri'],
            [
                'kontak' => 'Pak Slamet Riyadi',
                'telepon' => '087712349988',
                'alamat' => 'Imogiri Timur Km 14, Karangtalun, Imogiri, Bantul',
                'aktif' => true,
            ]
        );

        Pemasok::firstOrCreate(
            ['nama' => 'UD Sayur Segar Dataran Tinggi Ambarawa'],
            [
                'kontak' => 'Pak Bambang Setyawan',
                'telepon' => '085640112233',
                'alamat' => 'Bandungan, Ambarawa, Jawa Tengah',
                'aktif' => true,
            ]
        );

        Pemasok::firstOrCreate(
            ['nama' => 'CV Buah Nusantara Malang'],
            [
                'kontak' => 'Ibu Melinda Kurnia',
                'telepon' => '081288990011',
                'alamat' => 'Kecamatan Bumiaji, Batu, Malang, Jawa Timur',
                'aktif' => true,
            ]
        );

        // =========================================================================
        // 11. PELANGGAN LOYALITAS (CUSTOMERS)
        // =========================================================================
        $pelanggans = [
            [
                'telepon' => '085712345678',
                'nama' => 'Budi Santoso',
                'email' => 'budi.santoso@gmail.com',
                'alamat' => 'Jl. Gejayan No. 45, Condongcatur, Sleman',
                'poin' => 75,
            ],
            [
                'telepon' => '081987654321',
                'nama' => 'Dewi Lestari',
                'email' => 'dewi.lestari@gmail.com',
                'alamat' => 'Jl. Magelang Km 5.5, Mlati, Sleman',
                'poin' => 140,
            ],
            [
                'telepon' => '081234567801',
                'nama' => 'dr. Anita Rahmawati',
                'email' => 'anita.rahmawati@gmail.com',
                'alamat' => 'Jl. I Dewa Nyoman Oka No. 8, Kotabaru, Gondokusuman',
                'poin' => 320,
            ],
            [
                'telepon' => '081398765402',
                'nama' => 'Hendro Siswanto',
                'email' => 'hendro.siswanto@yahoo.com',
                'alamat' => 'Perum Candi Gebang Blok D-12, Wedomartani, Sleman',
                'poin' => 50,
            ],
            [
                'telepon' => '085811223303',
                'nama' => 'Maya Indrawati',
                'email' => 'maya.indrawati@outlook.com',
                'alamat' => 'Jl. Kaliurang Km 9.2, Ngaglik, Sleman',
                'poin' => 190,
            ],
            [
                'telepon' => '081299887705',
                'nama' => 'Chef Gunawan (Resto Hijau)',
                'email' => 'gunawan.catering@gmail.com',
                'alamat' => 'Jl. Sagan Kidul No. 15, Terban, Gondokusuman',
                'poin' => 480,
            ],
            [
                'telepon' => '081900112208',
                'nama' => 'Siti Maryam',
                'email' => 'siti.maryam88@gmail.com',
                'alamat' => 'Jl. Kaliurang Km 6.5, Manggung, Sleman',
                'poin' => 210,
            ],
        ];

        $daftarPelangganRecord = [];
        foreach ($pelanggans as $pel) {
            $record = Pelanggan::firstOrCreate(
                ['telepon' => $pel['telepon']],
                [
                    'nama' => $pel['nama'],
                    'email' => $pel['email'],
                    'alamat' => $pel['alamat'],
                    'poin' => $pel['poin'],
                    'aktif' => true,
                ]
            );
            $daftarPelangganRecord[] = $record;
        }

        // =========================================================================
        // 13. RIWAYAT TRANSAKSI PENJUALAN HISTORIS (7 HARI TERAKHIR & HARI INI)
        // =========================================================================
        // Membuat data riwayat 7 hari terakhir agar grafik Dashboard KPI, omzet, dan
        // top produk terlaris langsung tampil sangat nyata dan memukau.

        $semuaMetode = [$metodeTunai, $metodeQris, $metodeEdcBca];

        for ($hariLalu = 6; $hariLalu >= 0; $hariLalu--) {
            $tanggalTrans = Carbon::today('Asia/Jakarta')->subDays($hariLalu);
            $tanggalStr = $tanggalTrans->format('Ymd');
            $isToday = ($hariLalu === 0);

            // Shift kasir untuk hari tersebut
            $shiftHarian = ShiftKasir::firstOrCreate(
                [
                    'cabang_id' => $cabangUtama->id,
                    'pengguna_id' => $kasir1->id,
                    'waktu_buka' => $tanggalTrans->copy()->setTime(7, 30, 0),
                ],
                [
                    'waktu_tutup' => $isToday ? null : $tanggalTrans->copy()->setTime(21, 30, 0),
                    'modal_awal_rp' => '150000',
                    'saldo_sistem_rp' => '150000',
                    'saldo_fisik_rp' => $isToday ? null : '150000',
                    'selisih_rp' => $isToday ? null : '0',
                    'status' => $isToday ? 'buka' : 'tutup',
                ]
            );

            // Mutasi Kas modal awal jika belum ada
            MutasiKas::firstOrCreate(
                [
                    'shift_kasir_id' => $shiftHarian->id,
                    'nomor_ref' => 'MODAL-'.$tanggalStr,
                ],
                [
                    'jenis' => 'modal_awal',
                    'masuk_rp' => '150000',
                    'keluar_rp' => '0',
                    'keterangan' => 'Modal awal kas laci shift '.$tanggalTrans->toDateString(),
                ]
            );

            // Buat 4 s/d 6 transaksi per hari
            $jumlahTransaksiHariIni = $isToday ? 5 : rand(4, 7);

            for ($t = 1; $t <= $jumlahTransaksiHariIni; $t++) {
                $nomorNota = sprintf('PJ-%s-%04d', $tanggalStr, $t);

                // Cek apakah transaksi sudah ada
                if (Penjualan::where('nomor', $nomorNota)->exists()) {
                    continue;
                }

                $waktuJual = $tanggalTrans->copy()->setTime(rand(8, 20), rand(5, 55), rand(0, 59));
                $pelanggan = rand(0, 1) ? $daftarPelangganRecord[array_rand($daftarPelangganRecord)] : null;
                $metode = $semuaMetode[array_rand($semuaMetode)];

                // Pilih 2 s/d 4 produk acak
                $jumlahItem = rand(2, 4);
                $produkTerpilih = array_rand($daftarProdukId, $jumlahItem);
                if (! is_array($produkTerpilih)) {
                    $produkTerpilih = [$produkTerpilih];
                }

                $subtotal = 0;
                $hppTotal = 0;
                $itemsData = [];

                foreach ($produkTerpilih as $idx) {
                    $prod = $daftarProdukId[$idx];
                    $satProd = $daftarSatuanProdukId[$prod->id];

                    // Harga snapshot dari database
                    $hargaRecord = HargaProduk::where('satuan_produk_id', $satProd->id)->first();
                    $hargaSatuan = $hargaRecord ? (int) $hargaRecord->harga_rp : 10000;

                    // Qty acak
                    $qty = $prod->tipe_jual === 'timbang'
                        ? number_format((float) (rand(3, 20) / 10), 3, '.', '') // 0.300 s/d 2.000 kg
                        : (string) rand(1, 3).'.000';

                    $totalItem = (int) round((float) $qty * $hargaSatuan);
                    $hppItem = (int) round($totalItem * 0.65);

                    $subtotal += $totalItem;
                    $hppTotal += $hppItem;

                    $itemsData[] = [
                        'produk' => $prod,
                        'satuan_produk' => $satProd,
                        'qty' => $qty,
                        'harga_satuan' => (string) $hargaSatuan,
                        'total' => (string) $totalItem,
                        'hpp' => (string) $hppItem,
                    ];
                }

                $diskon = rand(0, 10) > 7 ? '5000' : '0';
                $totalAkhir = (string) max(0, $subtotal - (int) $diskon);

                $penjualan = Penjualan::create([
                    'cabang_id' => $cabangUtama->id,
                    'shift_kasir_id' => $shiftHarian->id,
                    'pelanggan_id' => $pelanggan ? $pelanggan->id : null,
                    'nomor' => $nomorNota,
                    'waktu_penjualan' => $waktuJual,
                    'status' => 'selesai',
                    'tipe_pesanan' => 'take_away',
                    'subtotal_rp' => (string) $subtotal,
                    'diskon_rp' => $diskon,
                    'pajak_rp' => '0',
                    'total_rp' => $totalAkhir,
                    'hpp_total_rp' => (string) $hppTotal,
                    'idempotency_key' => 'SEED-'.$nomorNota,
                    'catatan' => 'Transaksi resmi Kebun Kita',
                ]);

                // Simpan Item Jual
                foreach ($itemsData as $it) {
                    $itemJual = ItemJual::create([
                        'penjualan_id' => $penjualan->id,
                        'produk_id' => $it['produk']->id,
                        'satuan_produk_id' => $it['satuan_produk']->id,
                        'nama_snapshot' => $it['produk']->nama,
                        'satuan_snapshot' => $it['satuan_produk']->satuan->nama ?? 'Pcs',
                        'qty' => $it['qty'],
                        'harga_snapshot_rp' => $it['harga_satuan'],
                        'diskon_rp' => '0',
                        'total_rp' => $it['total'],
                        'hpp_rp' => $it['hpp'],
                    ]);

                    // Hubungkan alokasi lot
                    $lotAwal = LotStok::where('produk_id', $it['produk']->id)->first();
                    if ($lotAwal) {
                        AlokasiJualLot::create([
                            'item_jual_id' => $itemJual->id,
                            'lot_stok_id' => $lotAwal->id,
                            'qty_dasar' => $it['qty'],
                            'hpp_rp' => $it['hpp'],
                        ]);
                    }
                }

                // Simpan Pembayaran
                $uangDiterima = $metode->jenis === 'tunai'
                    ? (string) ((int) ceil((int) $totalAkhir / 50000) * 50000 ?: 50000)
                    : $totalAkhir;
                $kembalian = (string) max(0, (int) $uangDiterima - (int) $totalAkhir);

                BayarJual::create([
                    'penjualan_id' => $penjualan->id,
                    'metode_bayar_id' => $metode->id,
                    'nilai_rp' => $totalAkhir,
                    'diterima_rp' => $uangDiterima,
                    'kembalian_rp' => $kembalian,
                    'status' => 'sukses',
                    'ref_eksternal' => $metode->jenis !== 'tunai' ? 'REF-'.strtoupper(Str::random(8)) : null,
                ]);

                // Catat mutasi kas jika tunai
                if ($metode->jenis === 'tunai') {
                    MutasiKas::create([
                        'shift_kasir_id' => $shiftHarian->id,
                        'jenis' => 'penjualan_tunai',
                        'masuk_rp' => $totalAkhir,
                        'keluar_rp' => '0',
                        'nomor_ref' => $penjualan->nomor,
                        'keterangan' => 'Penjualan tunai nota '.$penjualan->nomor,
                    ]);

                    $shiftHarian->saldo_sistem_rp = (string) ((int) $shiftHarian->saldo_sistem_rp + (int) $totalAkhir);
                    $shiftHarian->save();
                }
            }
        }
    }

    /**
     * Kata sandi akun awal: wajib dari environment di produksi, nilai bawaan hanya untuk development.
     */
    private function kataSandiAwal(string $kunciEnv, string $bawaanDevelopment): string
    {
        $kataSandi = env($kunciEnv);

        if (app()->isProduction() && blank($kataSandi)) {
            throw new RuntimeException("{$kunciEnv} wajib diisi sebelum seeding di produksi.");
        }

        return Hash::make($kataSandi ?: $bawaanDevelopment);
    }
}
