<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Lokasi Stok
        Schema::create('lokasi_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->string('kode', 30);
            $table->string('nama', 100);
            $table->string('tipe', 30)->default('gudang'); // gudang, rak_toko, retur
            $table->timestamps();

            $table->unique(['cabang_id', 'kode']);
        });

        // 2. Saldo Stok (Materialized Read Cache)
        Schema::create('saldo_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('produk_id')->constrained('produk')->cascadeOnDelete();
            $table->foreignUuid('lokasi_stok_id')->constrained('lokasi_stok')->cascadeOnDelete();
            $table->decimal('qty_dasar', 18, 3)->default(0);
            $table->timestamps();

            $table->unique(['produk_id', 'lokasi_stok_id']);
        });

        // 3. Dokumen Stok (Induk Mutasi)
        Schema::create('dokumen_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->string('jenis', 50); // penerimaan_beli, penjualan, opname, susut, retur_jual
            $table->string('nomor', 50)->unique();
            $table->string('referensi_id', 100)->nullable();
            $table->timestampTz('waktu_posting');
            $table->timestamps();
        });

        // 4. Pesanan Beli (PO)
        Schema::create('pesanan_beli', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('pemasok_id')->constrained('pemasok')->restrictOnDelete();
            $table->string('nomor', 50)->unique();
            $table->string('status', 30)->default('draft'); // draft, disetujui, diterima_sebagian, diterima_penuh, batal
            $table->decimal('total_rp', 18, 0)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['cabang_id', 'status']);
        });

        // 5. Item Pesanan Beli
        Schema::create('item_beli', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pesanan_beli_id')->constrained('pesanan_beli')->cascadeOnDelete();
            $table->foreignUuid('produk_id')->constrained('produk')->restrictOnDelete();
            $table->foreignUuid('satuan_produk_id')->constrained('satuan_produk')->restrictOnDelete();
            $table->decimal('qty', 18, 3);
            $table->decimal('harga_rp', 18, 0);
            $table->decimal('subtotal_rp', 18, 0);
            $table->decimal('qty_diterima', 18, 3)->default(0);
            $table->timestamps();
        });

        // 6. Penerimaan Barang (Goods Receipt)
        Schema::create('terima_beli', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pesanan_beli_id')->constrained('pesanan_beli')->cascadeOnDelete();
            $table->foreignUuid('lokasi_stok_id')->constrained('lokasi_stok')->restrictOnDelete();
            $table->string('nomor', 50)->unique();
            $table->timestampTz('waktu_terima');
            $table->foreignUuid('penerima_id')->constrained('pengguna')->restrictOnDelete();
            $table->timestamps();
        });

        // 7. Item Penerimaan Barang
        Schema::create('item_terima', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('terima_beli_id')->constrained('terima_beli')->cascadeOnDelete();
            $table->foreignUuid('item_beli_id')->constrained('item_beli')->restrictOnDelete();
            $table->decimal('qty_diterima', 18, 3);
            $table->decimal('biaya_satuan_rp', 20, 6);
            $table->timestampTz('kedaluwarsa_pada')->nullable();
            $table->timestamps();
        });

        // 8. Lot Stok (Batch FEFO & HPP Aktual)
        Schema::create('lot_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('produk_id')->constrained('produk')->cascadeOnDelete();
            $table->foreignUuid('lokasi_stok_id')->constrained('lokasi_stok')->cascadeOnDelete();
            $table->foreignUuid('item_terima_id')->nullable()->constrained('item_terima')->nullOnDelete();
            $table->string('kode_lot', 50);
            $table->decimal('qty_awal', 18, 3);
            $table->decimal('qty_sisa', 18, 3);
            $table->decimal('hpp_dasar', 20, 6);
            $table->timestampTz('kedaluwarsa_pada')->nullable();
            $table->timestamps();

            $table->index(['produk_id', 'lokasi_stok_id', 'kedaluwarsa_pada', 'qty_sisa']);
        });

        // 9. Mutasi Stok (Ledger Immutable)
        Schema::create('mutasi_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('dokumen_stok_id')->constrained('dokumen_stok')->cascadeOnDelete();
            $table->foreignUuid('produk_id')->constrained('produk')->cascadeOnDelete();
            $table->foreignUuid('lokasi_stok_id')->constrained('lokasi_stok')->cascadeOnDelete();
            $table->foreignUuid('lot_stok_id')->nullable()->constrained('lot_stok')->nullOnDelete();
            $table->decimal('qty_delta', 18, 3); // Positif (masuk) atau Negatif (keluar)
            $table->decimal('nilai_hpp_rp', 20, 6);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['produk_id', 'lokasi_stok_id', 'created_at']);
        });

        // 10. Opname Stok (Stock Opname)
        Schema::create('opname_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('lokasi_stok_id')->constrained('lokasi_stok')->cascadeOnDelete();
            $table->string('nomor', 50)->unique();
            $table->string('status', 30)->default('draft'); // draft, diposting, batal
            $table->timestampTz('waktu_hitung');
            $table->foreignUuid('disetujui_oleh')->nullable()->constrained('pengguna')->nullOnDelete();
            $table->timestamps();
        });

        // 11. Item Opname Stok
        Schema::create('item_opname', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('opname_stok_id')->constrained('opname_stok')->cascadeOnDelete();
            $table->foreignUuid('produk_id')->constrained('produk')->restrictOnDelete();
            $table->foreignUuid('lot_stok_id')->nullable()->constrained('lot_stok')->nullOnDelete();
            $table->decimal('qty_sistem', 18, 3);
            $table->decimal('qty_fisik', 18, 3);
            $table->decimal('selisih', 18, 3);
            $table->timestamps();
        });

        // 12. Susut Stok (Waste / Sayur Rusak / Busuk)
        Schema::create('susut_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('lokasi_stok_id')->constrained('lokasi_stok')->cascadeOnDelete();
            $table->string('nomor', 50)->unique();
            $table->string('status', 30)->default('draft'); // draft, diposting, batal
            $table->string('alasan', 100);
            $table->foreignUuid('disetujui_oleh')->nullable()->constrained('pengguna')->nullOnDelete();
            $table->timestamps();
        });

        // 13. Item Susut Stok
        Schema::create('item_susut', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('susut_stok_id')->constrained('susut_stok')->cascadeOnDelete();
            $table->foreignUuid('lot_stok_id')->constrained('lot_stok')->cascadeOnDelete();
            $table->decimal('qty', 18, 3);
            $table->decimal('nilai_hpp_rp', 20, 6);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_susut');
        Schema::dropIfExists('susut_stok');
        Schema::dropIfExists('item_opname');
        Schema::dropIfExists('opname_stok');
        Schema::dropIfExists('mutasi_stok');
        Schema::dropIfExists('lot_stok');
        Schema::dropIfExists('item_terima');
        Schema::dropIfExists('terima_beli');
        Schema::dropIfExists('item_beli');
        Schema::dropIfExists('pesanan_beli');
        Schema::dropIfExists('dokumen_stok');
        Schema::dropIfExists('saldo_stok');
        Schema::dropIfExists('lokasi_stok');
    }
};

