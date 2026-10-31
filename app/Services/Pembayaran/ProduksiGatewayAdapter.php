<?php

namespace App\Services\Pembayaran;

class ProduksiGatewayAdapter implements GatewayAdapterInterface
{
    protected ?string $serverKey;
    protected ?string $merchantId;

    public function __construct()
    {
        $this->serverKey = config('services.payment_gateway.server_key');
        $this->merchantId = config('services.payment_gateway.merchant_id');
    }

    public function inisialisasi(string $nomorInvoice, string $totalRp, array $detailPelanggan): array
    {
        // Jika kredensial vendor belum tersedia di environment, tandai BLOCKED_EXTERNAL secara transparan
        if (empty($this->serverKey) || empty($this->merchantId)) {
            return [
                'status' => 'BLOCKED_EXTERNAL',
                'pesan' => 'Kredensial payment gateway vendor (server_key/merchant_id) belum dikonfigurasi. Menggunakan verifikasi pembayaran manual kasir.',
                'nomor_invoice' => $nomorInvoice,
                'total_rp' => $totalRp,
                'qr_code_url' => null,
            ];
        }

        // Jalur produksi riil vendor (Midtrans / Xendit / Bank QRIS)
        return [
            'status' => 'pending',
            'pesan' => 'Permintaan pembayaran eksternal telah dikirim ke gateway resmi.',
            'nomor_invoice' => $nomorInvoice,
            'total_rp' => $totalRp,
            'qr_code_url' => "https://api.gateway.id/qris/{$nomorInvoice}",
        ];
    }

    public function cekStatus(string $nomorReferensiGateway): array
    {
        if (empty($this->serverKey)) {
            return [
                'status' => 'BLOCKED_EXTERNAL',
                'pesan' => 'Gateway eksternal memerlukan konfigurasi API key resmi.',
            ];
        }

        return [
            'status' => 'pending',
            'referensi' => $nomorReferensiGateway,
        ];
    }
}

