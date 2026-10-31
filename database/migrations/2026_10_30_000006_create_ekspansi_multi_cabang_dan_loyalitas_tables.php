<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Transfer Stok Antar Cabang
        Schema::create('transfer_stok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_asal_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('cabang_tujuan_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('pengirim_id')->constrained('pengguna')->restrictOnDelete();
            $table->foreignUuid('penerima_id')->nullable()->constrained('pengguna')->nullOnDelete();
            $table->string('nomor', 50)->unique();
            $table->timestampTz('waktu_kirim');
            $table->timestampTz('waktu_terima')->nullable();
            $table->string('status', 30)->default('dikirim'); // draft, dikirim, diterima, batal
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['cabang_asal_id', 'cabang_tujuan_id', 'status']);
        });

        // 2. Item Transfer Stok
        Schema::create('item_transfer', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('transfer_stok_id')->constrained('transfer_stok')->cascadeOnDelete();
            $table->foreignUuid('produk_id')->constrained('produk')->restrictOnDelete();
            $table->foreignUuid('satuan_produk_id')->constrained('satuan_produk')->restrictOnDelete();
            $table->decimal('qty_kirim', 18, 3);
            $table->decimal('qty_terima', 18, 3)->nullable();
            $table->decimal('hpp_satuan_rp', 20, 6)->default(0);
            $table->timestamps();
        });

        // 3. Log Poin Loyalitas Pelanggan
        Schema::create('poin_pelanggan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pelanggan_id')->constrained('pelanggan')->cascadeOnDelete();
            $table->foreignUuid('penjualan_id')->nullable()->constrained('penjualan')->nullOnDelete();
            $table->string('jenis', 30); // perolehan, penukaran, penyesuaian
            $table->integer('jumlah_poin');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poin_pelanggan');
        Schema::dropIfExists('item_transfer');
        Schema::dropIfExists('transfer_stok');
    }
};

