<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Retur Penjualan Induk
        Schema::create('retur_jual', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->constrained('cabang')->cascadeOnDelete();
            $table->foreignUuid('penjualan_id')->constrained('penjualan')->restrictOnDelete();
            $table->foreignUuid('shift_kasir_id')->nullable()->constrained('shift_kasir')->nullOnDelete();
            $table->foreignUuid('pengguna_id')->constrained('pengguna')->restrictOnDelete();
            $table->string('nomor', 50)->unique();
            $table->timestampTz('waktu_retur');
            $table->string('status', 30)->default('selesai'); // draft, diproses, selesai, dibatalkan
            $table->decimal('total_refund_rp', 18, 0);
            $table->text('alasan');
            $table->timestamps();

            $table->index(['cabang_id', 'waktu_retur']);
        });

        // 2. Item Retur Penjualan
        Schema::create('item_retur', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('retur_jual_id')->constrained('retur_jual')->cascadeOnDelete();
            $table->foreignUuid('item_jual_id')->constrained('item_jual')->restrictOnDelete();
            $table->decimal('qty', 18, 3);
            $table->decimal('nilai_refund_rp', 18, 0);
            $table->boolean('layak_jual')->default(true); // jika true: stok kembali; jika false: susut/rusak
            $table->text('keterangan_kondisi')->nullable();
            $table->timestamps();
        });

        // 3. Refund Pembayaran (Pengembalian Uang)
        Schema::create('refund_bayar', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('retur_jual_id')->constrained('retur_jual')->cascadeOnDelete();
            $table->foreignUuid('metode_bayar_id')->constrained('metode_bayar')->restrictOnDelete();
            $table->decimal('nilai_rp', 18, 0);
            $table->string('status', 30)->default('sukses'); // sukses, pending, gagal
            $table->string('ref_eksternal', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refund_bayar');
        Schema::dropIfExists('item_retur');
        Schema::dropIfExists('retur_jual');
    }
};

