<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Shift Kasir
        Schema::create('shift_kasir', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('pengguna_id')->constrained('pengguna')->restrictOnDelete();
            $table->timestampTz('waktu_buka');
            $table->timestampTz('waktu_tutup')->nullable();
            $table->decimal('modal_awal_rp', 18, 0);
            $table->decimal('saldo_sistem_rp', 18, 0)->default(0);
            $table->decimal('saldo_fisik_rp', 18, 0)->nullable();
            $table->decimal('selisih_rp', 18, 0)->nullable();
            $table->text('catatan_selisih')->nullable();
            $table->string('status', 30)->default('buka'); // buka, tutup
            $table->timestamps();

            $table->index(['cabang_id', 'pengguna_id', 'status']);
        });

        // 2. Metode Bayar
        Schema::create('metode_bayar', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 30)->unique();
            $table->string('nama', 50);
            $table->string('jenis', 30); // tunai, transfer, qris, kartu
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // 3. Penjualan
        Schema::create('penjualan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('shift_kasir_id')->constrained('shift_kasir')->restrictOnDelete();
            $table->foreignUuid('pelanggan_id')->nullable()->constrained('pelanggan')->nullOnDelete();
            $table->string('nomor', 50)->unique();
            $table->timestampTz('waktu_penjualan');
            $table->string('status', 30)->default('selesai'); // draft, menunggu_bayar, selesai, batal, retur_sebagian, retur_penuh
            $table->string('tipe_pesanan', 30)->default('take_away'); // dine_in, take_away, delivery, custom
            $table->decimal('subtotal_rp', 18, 0);
            $table->decimal('diskon_rp', 18, 0)->default(0);
            $table->decimal('pajak_rp', 18, 0)->default(0);
            $table->decimal('total_rp', 18, 0);
            $table->decimal('hpp_total_rp', 18, 0)->default(0);
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['cabang_id', 'status', 'waktu_penjualan']);
        });

        // 4. Item Penjualan (Snapshot Immutability)
        Schema::create('item_jual', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('penjualan_id')->constrained('penjualan')->cascadeOnDelete();
            $table->foreignUuid('produk_id')->constrained('produk')->restrictOnDelete();
            $table->foreignUuid('satuan_produk_id')->constrained('satuan_produk')->restrictOnDelete();
            $table->string('nama_snapshot', 150);
            $table->string('satuan_snapshot', 50);
            $table->decimal('qty', 18, 3);
            $table->decimal('harga_snapshot_rp', 18, 0);
            $table->decimal('diskon_rp', 18, 0)->default(0);
            $table->decimal('total_rp', 18, 0);
            $table->decimal('hpp_rp', 18, 0)->default(0);
            $table->timestamps();
        });

        // 5. Alokasi Jual Lot (FEFO Tracking)
        Schema::create('alokasi_jual_lot', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('item_jual_id')->constrained('item_jual')->cascadeOnDelete();
            $table->foreignUuid('lot_stok_id')->constrained('lot_stok')->restrictOnDelete();
            $table->decimal('qty_dasar', 18, 3);
            $table->decimal('hpp_rp', 20, 6);
            $table->timestamps();
        });

        // 6. Pembayaran Penjualan
        Schema::create('bayar_jual', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('penjualan_id')->constrained('penjualan')->cascadeOnDelete();
            $table->foreignUuid('metode_bayar_id')->constrained('metode_bayar')->restrictOnDelete();
            $table->decimal('nilai_rp', 18, 0);
            $table->decimal('diterima_rp', 18, 0);
            $table->decimal('kembalian_rp', 18, 0)->default(0);
            $table->string('status', 30)->default('sukses'); // sukses, pending, gagal
            $table->string('ref_eksternal', 100)->nullable();
            $table->timestamps();
        });

        // 7. Mutasi Kas Fisik Laci
        Schema::create('mutasi_kas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shift_kasir_id')->constrained('shift_kasir')->cascadeOnDelete();
            $table->string('jenis', 30); // modal_awal, penjualan_tunai, kembalian, kas_masuk_manual, kas_keluar_manual, refund_tunai
            $table->decimal('masuk_rp', 18, 0)->default(0);
            $table->decimal('keluar_rp', 18, 0)->default(0);
            $table->string('nomor_ref', 100)->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutasi_kas');
        Schema::dropIfExists('bayar_jual');
        Schema::dropIfExists('alokasi_jual_lot');
        Schema::dropIfExists('item_jual');
        Schema::dropIfExists('penjualan');
        Schema::dropIfExists('metode_bayar');
        Schema::dropIfExists('shift_kasir');
    }
};

