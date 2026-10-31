<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Kategori Produk
        Schema::create('kategori_produk', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 100);
            $table->uuid('induk_id')->nullable();
            $table->integer('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::table('kategori_produk', function (Blueprint $table) {
            $table->foreign('induk_id')->references('id')->on('kategori_produk')->nullOnDelete();
        });

        // 2. Satuan Ukuran
        Schema::create('satuan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 20)->unique();
            $table->string('nama', 50);
            $table->string('jenis', 30); // berat, cacah, kemasan
            $table->timestamps();
        });

        // 3. Produk
        Schema::create('produk', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kategori_produk_id')->constrained('kategori_produk')->restrictOnDelete();
            $table->foreignUuid('satuan_dasar_id')->constrained('satuan')->restrictOnDelete();
            $table->string('sku', 50)->unique();
            $table->string('nama', 150);
            $table->text('deskripsi')->nullable();
            $table->string('tipe_jual', 30)->default('timbang'); // timbang, satuan
            $table->string('foto_url', 255)->nullable();
            $table->decimal('stok_minimum', 18, 3)->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();

            $table->index(['nama', 'aktif']);
            $table->index('kategori_produk_id');
        });

        // 4. Satuan Produk (Satuan Jual / Beli & Barcode)
        Schema::create('satuan_produk', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('produk_id')->constrained('produk')->cascadeOnDelete();
            $table->foreignUuid('satuan_id')->constrained('satuan')->restrictOnDelete();
            $table->decimal('faktor_ke_dasar', 20, 6)->default(1);
            $table->string('barcode', 50)->nullable()->unique();
            $table->boolean('bisa_dijual')->default(true);
            $table->boolean('bisa_dibeli')->default(true);
            $table->timestamps();

            $table->unique(['produk_id', 'satuan_id']);
        });

        // 5. Riwayat Harga Produk (Bertanggal)
        Schema::create('harga_produk', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('satuan_produk_id')->constrained('satuan_produk')->cascadeOnDelete();
            $table->foreignUuid('cabang_id')->nullable()->constrained('cabang')->cascadeOnDelete();
            $table->string('jenis_harga', 30)->default('reguler'); // reguler, grosir, promo
            $table->decimal('harga_rp', 18, 0);
            $table->timestampTz('mulai_pada');
            $table->timestampTz('akhir_pada')->nullable();
            $table->timestamps();

            $table->index(['satuan_produk_id', 'cabang_id', 'mulai_pada', 'akhir_pada']);
        });

        // 6. Pemasok (Supplier)
        Schema::create('pemasok', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 150);
            $table->string('kontak', 100)->nullable();
            $table->string('telepon', 30)->nullable();
            $table->text('alamat')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // 7. Pelanggan (Customer)
        Schema::create('pelanggan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 150);
            $table->string('telepon', 30)->nullable()->unique();
            $table->string('email', 150)->nullable();
            $table->text('alamat')->nullable();
            $table->integer('poin')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelanggan');
        Schema::dropIfExists('pemasok');
        Schema::dropIfExists('harga_produk');
        Schema::dropIfExists('satuan_produk');
        Schema::dropIfExists('produk');
        Schema::dropIfExists('satuan');
        Schema::dropIfExists('kategori_produk');
    }
};

