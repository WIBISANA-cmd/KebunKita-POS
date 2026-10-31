<?php

namespace App\Services\Pembayaran;

interface GatewayAdapterInterface
{
    /**
     * Inisialisasi permintaan pembayaran ke gateway.
     * Mengembalikan status transaksi atau kode BLOCKED_EXTERNAL jika belum terkonfigurasi.
     */
    public function inisialisasi(string $nomorInvoice, string $totalRp, array $detailPelanggan): array;

    /**
     * Periksa status pembayaran secara berkala / webhook.
     */
    public function cekStatus(string $nomorReferensiGateway): array;
}

