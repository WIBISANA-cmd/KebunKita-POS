<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Cabang
        Schema::create('cabang', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->text('alamat')->nullable();
            $table->string('telepon', 30)->nullable();
            $table->string('zona_waktu', 50)->default('Asia/Jakarta');
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // 2. Pengguna
        Schema::create('pengguna', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->nullable()->constrained('cabang')->nullOnDelete();
            $table->string('nama', 100);
            $table->string('email', 150)->unique();
            $table->string('password', 255);
            $table->string('telepon', 30)->nullable();
            $table->boolean('aktif')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        // 3. Peran (Role)
        Schema::create('peran', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 50)->unique();
            $table->string('nama', 100);
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        // 4. Izin (Permission)
        Schema::create('izin', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 100)->unique();
            $table->string('nama', 150);
            $table->timestamps();
        });

        // 5. Pivot Pengguna - Peran
        Schema::create('pengguna_peran', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('pengguna_id')->constrained('pengguna')->cascadeOnDelete();
            $table->foreignUuid('peran_id')->constrained('peran')->cascadeOnDelete();
            $table->foreignUuid('cabang_id')->nullable()->constrained('cabang')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['pengguna_id', 'peran_id', 'cabang_id']);
        });

        // 6. Pivot Peran - Izin
        Schema::create('peran_izin', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('peran_id')->constrained('peran')->cascadeOnDelete();
            $table->foreignUuid('izin_id')->constrained('izin')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['peran_id', 'izin_id']);
        });

        // 7. Audit Aksi (Append-Only)
        Schema::create('audit_aksi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pengguna_id')->nullable()->constrained('pengguna')->nullOnDelete();
            $table->foreignUuid('cabang_id')->nullable()->constrained('cabang')->nullOnDelete();
            $table->string('aksi', 50);
            $table->string('entitas', 100);
            $table->string('entitas_id', 100);
            $table->jsonb('data_lama')->nullable();
            $table->jsonb('data_baru')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['entitas', 'entitas_id']);
            $table->index('created_at');
        });

        // 8. Pengaturan Toko
        Schema::create('pengaturan_toko', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cabang_id')->nullable()->constrained('cabang')->cascadeOnDelete();
            $table->string('kunci', 100);
            $table->jsonb('nilai_json');
            $table->timestamps();

            $table->unique(['cabang_id', 'kunci']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturan_toko');
        Schema::dropIfExists('audit_aksi');
        Schema::dropIfExists('peran_izin');
        Schema::dropIfExists('pengguna_peran');
        Schema::dropIfExists('izin');
        Schema::dropIfExists('peran');
        Schema::dropIfExists('pengguna');
        Schema::dropIfExists('cabang');
    }
};
