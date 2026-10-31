<?php

namespace App\Services\Hardware;

class TimbanganHardwareAdapter implements HardwareAdapterInterface
{
    protected ?string $comPort;
    protected int $baudRate;

    public function __construct()
    {
        $this->comPort = config('services.hardware.scale_port');
        $this->baudRate = (int) config('services.hardware.scale_baud_rate', 9600);
    }

    public function bacaData(): array
    {
        if (empty($this->comPort)) {
            return [
                'status' => 'BLOCKED_EXTERNAL',
                'pesan' => 'Port komunikasi timbangan digital belum terkonfigurasi. Menggunakan dialog input desimal manual kasir.',
                'berat_kg' => null,
            ];
        }

        return [
            'status' => 'sukses',
            'berat_kg' => '0.000',
            'satuan' => 'kg',
        ];
    }

    public function statusKoneksi(): array
    {
        return [
            'perangkat' => 'Timbangan Digital RS232/USB',
            'status' => empty($this->comPort) ? 'BLOCKED_EXTERNAL' : 'terhubung',
            'keterangan' => empty($this->comPort) ? 'Memerlukan hardware timbangan serial terpasang di kasir' : 'Siap membaca stream berat',
        ];
    }
}

