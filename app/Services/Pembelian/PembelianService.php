<?php

namespace App\Services\Pembelian;

use App\Models\ItemBeli;
use App\Models\PesananBeli;
use App\Models\SatuanProduk;
use App\Services\Pengguna\AuditService;
use App\Support\NomorDokumen;
use App\Support\Uang;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PembelianService
{
    public function daftar(?string $cabangId = null, ?string $status = null, int $perHalaman = 15): LengthAwarePaginator
    {
        $query = PesananBeli::with(['pemasok', 'cabang', 'items.produk.satuanDasar', 'items.satuanProduk.satuan'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        if ($cabangId) {
            $query->where('cabang_id', $cabangId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate($perHalaman);
    }

    public function buat(array $data, string $cabangId): PesananBeli
    {
        return DB::transaction(function () use ($data, $cabangId) {
            $totalRp = '0';
            $itemsData = [];

            foreach ($data['items'] as $item) {
                $satuanProduk = SatuanProduk::with('produk')->findOrFail($item['satuan_produk_id']);
                $subtotal = Uang::kali($item['qty'], $item['harga_rp']);
                $totalRp = Uang::tambah($totalRp, $subtotal);

                $itemsData[] = [
                    'produk_id' => $satuanProduk->produk_id,
                    'satuan_produk_id' => $satuanProduk->id,
                    'qty' => (string) $item['qty'],
                    'harga_rp' => (string) (int) $item['harga_rp'],
                    'subtotal_rp' => $subtotal,
                    'qty_diterima' => '0.000',
                ];
            }

            $nomor = NomorDokumen::buat('PO');

            $po = PesananBeli::create([
                'cabang_id' => $cabangId,
                'pemasok_id' => $data['pemasok_id'],
                'nomor' => $nomor,
                'status' => 'draft',
                'total_rp' => $totalRp,
                'catatan' => $data['catatan'] ?? null,
            ]);

            foreach ($itemsData as $row) {
                $po->items()->create($row);
            }

            AuditService::catat('BUAT_PO', 'pesanan_beli', $po->id, null, [
                'nomor' => $nomor,
                'total_rp' => $totalRp,
            ], $cabangId);

            return $po->load(['pemasok', 'items.produk']);
        });
    }

    public function setujui(PesananBeli $po): PesananBeli
    {
        if ($po->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Hanya PO berstatus draft yang dapat disetujui.'],
            ]);
        }

        $po->update(['status' => 'disetujui']);

        AuditService::catat('SETUJUI_PO', 'pesanan_beli', $po->id, ['status' => 'draft'], ['status' => 'disetujui'], $po->cabang_id);

        return $po;
    }
}

