<?php

namespace App\Services\Produk;

use App\Models\Produk;
use App\Models\SatuanProduk;
use App\Services\Pengguna\AuditService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProdukService
{
    public function __construct(
        protected HargaService $hargaService
    ) {}

    /**
     * Ambil katalog produk dengan filter kategori, pencarian, dan harga aktif.
     */
    public function daftar(?string $kategoriId = null, ?string $q = null, ?string $cabangId = null, bool $hanyaAktif = true, int $perHalaman = 20): LengthAwarePaginator
    {
        $query = Produk::with(['kategori', 'satuanDasar', 'satuanProduk.satuan'])
            ->orderBy('nama', 'asc')
            ->orderBy('id');

        if ($hanyaAktif) {
            $query->where('aktif', true);
        }

        if ($kategoriId && $kategoriId !== 'all') {
            $query->where('kategori_produk_id', $kategoriId);
        }

        if ($q) {
            $query->cari($q);
        }

        $paginator = $query->paginate($perHalaman);

        // Pasang harga aktif saat ini pada setiap satuan produk
        $paginator->getCollection()->transform(function (Produk $produk) use ($cabangId) {
            foreach ($produk->satuanProduk as $sp) {
                $sp->setRelation('harga_aktif', $this->hargaService->ambilHargaAktif($sp->id, $cabangId));
            }
            return $produk;
        });

        return $paginator;
    }

    /**
     * Tambah produk baru beserta satuan jual dan harga perdana.
     */
    public function buat(array $data, ?string $cabangId = null): Produk
    {
        return DB::transaction(function () use ($data, $cabangId) {
            $produk = Produk::create([
                'kategori_produk_id' => $data['kategori_produk_id'],
                'satuan_dasar_id' => $data['satuan_dasar_id'],
                'sku' => strtoupper(trim($data['sku'])),
                'nama' => trim($data['nama']),
                'deskripsi' => $data['deskripsi'] ?? null,
                'tipe_jual' => $data['tipe_jual'] ?? 'timbang',
                'foto_url' => $data['foto_url'] ?? null,
                'stok_minimum' => (string) ($data['stok_minimum'] ?? '0.000'),
                'aktif' => $data['aktif'] ?? true,
            ]);

            // Satuan utama default (faktor = 1 ke satuan dasar)
            $satuanUtama = SatuanProduk::create([
                'produk_id' => $produk->id,
                'satuan_id' => $data['satuan_dasar_id'],
                'faktor_ke_dasar' => '1.000000',
                'barcode' => ! empty($data['barcode']) ? trim($data['barcode']) : null,
                'bisa_dijual' => true,
                'bisa_dibeli' => true,
            ]);

            // Jika disertakan harga perdana
            if (! empty($data['harga_rp'])) {
                $this->hargaService->tetapkanHarga([
                    'satuan_produk_id' => $satuanUtama->id,
                    'cabang_id' => $cabangId,
                    'harga_rp' => $data['harga_rp'],
                    'mulai_pada' => now()->toIso8601String(),
                ]);
            }

            // Satuan turunan tambahan jika ada (misal gram untuk kg)
            if (! empty($data['satuan_tambahan']) && is_array($data['satuan_tambahan'])) {
                foreach ($data['satuan_tambahan'] as $st) {
                    $satuanTambahan = SatuanProduk::create([
                        'produk_id' => $produk->id,
                        'satuan_id' => $st['satuan_id'],
                        'faktor_ke_dasar' => (string) $st['faktor_ke_dasar'],
                        'barcode' => ! empty($st['barcode']) ? trim($st['barcode']) : null,
                        'bisa_dijual' => $st['bisa_dijual'] ?? true,
                        'bisa_dibeli' => $st['bisa_dibeli'] ?? true,
                    ]);

                    if (! empty($st['harga_rp'])) {
                        $this->hargaService->tetapkanHarga([
                            'satuan_produk_id' => $satuanTambahan->id,
                            'cabang_id' => $cabangId,
                            'harga_rp' => $st['harga_rp'],
                            'mulai_pada' => now()->toIso8601String(),
                        ]);
                    }
                }
            }

            AuditService::catat('BUAT', 'produk', $produk->id, null, [
                'sku' => $produk->sku,
                'nama' => $produk->nama,
            ]);

            return $this->detail($produk->id, $cabangId);
        });
    }

    /**
     * Ambil detail lengkap produk tunggal.
     */
    public function detail(string $id, ?string $cabangId = null): Produk
    {
        $produk = Produk::with(['kategori', 'satuanDasar', 'satuanProduk.satuan', 'satuanProduk.riwayatHarga'])
            ->findOrFail($id);

        foreach ($produk->satuanProduk as $sp) {
            $sp->setRelation('harga_aktif', $this->hargaService->ambilHargaAktif($sp->id, $cabangId));
        }

        return $produk;
    }

    /**
     * Perbarui data produk.
     */
    public function perbarui(Produk $produk, array $data, ?string $cabangId = null): Produk
    {
        return DB::transaction(function () use ($produk, $data, $cabangId) {
            $dataLama = $produk->only(['nama', 'kategori_produk_id', 'stok_minimum', 'aktif']);

            $produk->update([
                'nama' => $data['nama'] ?? $produk->nama,
                'kategori_produk_id' => $data['kategori_produk_id'] ?? $produk->kategori_produk_id,
                'deskripsi' => array_key_exists('deskripsi', $data) ? $data['deskripsi'] : $produk->deskripsi,
                'foto_url' => array_key_exists('foto_url', $data) ? $data['foto_url'] : $produk->foto_url,
                'stok_minimum' => isset($data['stok_minimum']) ? (string) $data['stok_minimum'] : $produk->stok_minimum,
                'aktif' => array_key_exists('aktif', $data) ? (bool) $data['aktif'] : $produk->aktif,
            ]);

            // Jika ada perubahan harga pada satuan utama
            if (isset($data['harga_rp'])) {
                $satuanUtama = $produk->satuanProduk()->where('satuan_id', $produk->satuan_dasar_id)->first();
                if ($satuanUtama) {
                    $this->hargaService->tetapkanHarga([
                        'satuan_produk_id' => $satuanUtama->id,
                        'cabang_id' => $cabangId,
                        'harga_rp' => $data['harga_rp'],
                        'mulai_pada' => now()->toIso8601String(),
                    ]);
                }
            }

            AuditService::catat('UBAH', 'produk', $produk->id, $dataLama, $produk->only(['nama', 'kategori_produk_id', 'stok_minimum', 'aktif']));

            return $this->detail($produk->id, $cabangId);
        });
    }

    /**
     * Nonaktifkan produk (soft archive, aman terhadap relasi transaksi).
     */
    public function arsipkan(Produk $produk): void
    {
        $produk->update(['aktif' => false]);
        AuditService::catat('ARSIP', 'produk', $produk->id, ['aktif' => true], ['aktif' => false]);
    }
}

