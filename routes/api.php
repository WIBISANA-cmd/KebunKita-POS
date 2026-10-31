<?php

use Illuminate\Support\Facades\Route;
use App\Support\ResponsApi;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PenggunaController;
use App\Http\Controllers\Api\V1\CabangController;
use App\Http\Controllers\Api\V1\ProdukController;
use App\Http\Controllers\Api\V1\KategoriController;
use App\Http\Controllers\Api\V1\SatuanController;
use App\Http\Controllers\Api\V1\HargaController;
use App\Http\Controllers\Api\V1\PemasokController;
use App\Http\Controllers\Api\V1\PelangganController;
use App\Http\Controllers\Api\V1\StokController;
use App\Http\Controllers\Api\V1\PembelianController;
use App\Http\Controllers\Api\V1\PenerimaanController;
use App\Http\Controllers\Api\V1\OpnameController;
use App\Http\Controllers\Api\V1\SusutController;
use App\Http\Controllers\Api\V1\LokasiStokController;
use App\Http\Controllers\Api\V1\ShiftKasirController;
use App\Http\Controllers\Api\V1\PenjualanController;
use App\Http\Controllers\Api\V1\MetodeBayarController;
use App\Http\Controllers\Api\V1\ReturJualController;
use App\Http\Controllers\Api\V1\PembayaranLanjutanController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\LaporanController;
use App\Http\Controllers\Api\V1\TransferStokController;
use App\Http\Controllers\Api\V1\HardwareController;
use App\Http\Controllers\Api\V1\NotifikasiController;

// 1. Health Endpoint
Route::get('/health', function () {
    return ResponsApi::sukses([
        'status' => 'sehat',
        'aplikasi' => 'Kebun Kita POS API',
        'versi' => '1.0.0',
        'lingkungan' => app()->environment(),
    ], 'Layanan API Kebun Kita berjalan normal.');
});

// 2. Autentikasi (Sanctum SPA Cookie)
Route::post('/auth/masuk', [AuthController::class, 'masuk'])->middleware('throttle:10,1');
Route::get('/auth/saya', [AuthController::class, 'saya']);
Route::post('/auth/keluar', [AuthController::class, 'keluar']);

// 3. Rute Terproteksi (Sanctum Session & Scope Cabang Anti-IDOR)
Route::middleware(['auth:sanctum', 'scope.cabang'])->group(function () {
    // Pengguna & Cabang (M02)
    Route::get('/pengguna', [PenggunaController::class, 'index']);
    Route::post('/pengguna', [PenggunaController::class, 'store']);
    Route::get('/pengguna/{pengguna}', [PenggunaController::class, 'show']);
    Route::patch('/pengguna/{pengguna}', [PenggunaController::class, 'update']);

    Route::get('/cabang', [CabangController::class, 'index']);
    Route::post('/cabang', [CabangController::class, 'store']);
    Route::get('/cabang/{cabang}', [CabangController::class, 'show']);

    // Produk, Kategori, Satuan, Harga, Pemasok, Pelanggan (M03)
    Route::get('/produk', [ProdukController::class, 'index']);
    Route::post('/produk', [ProdukController::class, 'store']);
    Route::get('/produk/{id}', [ProdukController::class, 'show']);
    Route::patch('/produk/{produk}', [ProdukController::class, 'update']);
    Route::delete('/produk/{produk}', [ProdukController::class, 'destroy']);

    Route::get('/kategori', [KategoriController::class, 'index']);
    Route::post('/kategori', [KategoriController::class, 'store']);

    Route::get('/satuan', [SatuanController::class, 'index']);
    Route::post('/satuan', [SatuanController::class, 'store']);

    Route::post('/harga', [HargaController::class, 'store']);
    Route::get('/harga/riwayat/{satuanProdukId}', [HargaController::class, 'riwayat']);

    Route::get('/pemasok', [PemasokController::class, 'index']);
    Route::post('/pemasok', [PemasokController::class, 'store']);

    Route::get('/pelanggan', [PelangganController::class, 'index']);
    Route::post('/pelanggan', [PelangganController::class, 'store']);

    // Persediaan, Lokasi, Mutasi, PO, Penerimaan, Opname, Susut (M04)
    Route::get('/lokasi-stok', [LokasiStokController::class, 'index']);
    Route::post('/lokasi-stok', [LokasiStokController::class, 'store']);

    Route::get('/stok/saldo', [StokController::class, 'saldo']);
    Route::get('/stok/lot', [StokController::class, 'lotAktif']);
    Route::get('/stok/mutasi', [StokController::class, 'mutasi']);

    Route::get('/pembelian', [PembelianController::class, 'index']);
    Route::post('/pembelian', [PembelianController::class, 'store']);
    Route::get('/pembelian/{pembelian}', [PembelianController::class, 'show']);
    Route::post('/pembelian/{pembelian}/setujui', [PembelianController::class, 'setujui']);
    Route::post('/pembelian/{pembelian}/penerimaan', [PenerimaanController::class, 'store']);

    Route::post('/stok/opname', [OpnameController::class, 'store']);
    Route::post('/stok/susut', [SusutController::class, 'store']);

    // Kasir POS, Shift, Penjualan & Metode Bayar (M05)
    Route::get('/shift/aktif', [ShiftKasirController::class, 'statusAktif']);
    Route::post('/shift/buka', [ShiftKasirController::class, 'buka']);
    Route::post('/shift/tutup', [ShiftKasirController::class, 'tutup']);
    Route::post('/shift/mutasi-kas', [ShiftKasirController::class, 'mutasiKasManual']);
    Route::get('/shift/riwayat', [ShiftKasirController::class, 'riwayat']);

    Route::get('/metode-bayar', [MetodeBayarController::class, 'index']);
    Route::post('/metode-bayar', [MetodeBayarController::class, 'store']);

    Route::get('/penjualan', [PenjualanController::class, 'index']);
    Route::post('/penjualan', [PenjualanController::class, 'store']);
    Route::get('/penjualan/{id}', [PenjualanController::class, 'show']);

    // Retur Penjualan & Pembayaran Lanjutan (M06)
    Route::get('/retur-jual', [ReturJualController::class, 'index']);
    Route::post('/retur-jual', [ReturJualController::class, 'store']);
    Route::post('/pembayaran/inisialisasi-qris', [PembayaranLanjutanController::class, 'inisialisasiQris']);

    // Dashboard & Laporan Analitik (M07)
    Route::get('/notifikasi/transaksi', [NotifikasiController::class, 'transaksi']);

    Route::get('/dashboard/ringkasan', [DashboardController::class, 'ringkasan']);
    Route::get('/dashboard/grafik-penjualan', [DashboardController::class, 'grafikPenjualan']);
    Route::get('/dashboard/penjualan-kategori', [DashboardController::class, 'penjualanKategori']);
    Route::get('/dashboard/metode-bayar', [DashboardController::class, 'metodeBayar']);
    Route::get('/dashboard/top-produk', [DashboardController::class, 'topProduk']);

    Route::get('/laporan/penjualan', [LaporanController::class, 'penjualan']);
    Route::get('/laporan/laba-rugi', [LaporanController::class, 'labaRugi']);
    Route::get('/laporan/ekspor-penjualan', [LaporanController::class, 'eksporPenjualan']);

    // Multi-Cabang & Hardware Adapters (M09)
    Route::get('/transfer-stok', [TransferStokController::class, 'index']);
    Route::post('/transfer-stok', [TransferStokController::class, 'store']);
    Route::post('/transfer-stok/{id}/terima', [TransferStokController::class, 'terima']);
    Route::get('/hardware/timbangan/status', [HardwareController::class, 'statusTimbangan']);
    Route::get('/hardware/timbangan/baca', [HardwareController::class, 'bacaTimbangan']);
});
