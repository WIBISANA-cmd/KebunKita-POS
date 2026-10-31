<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EksporLaporanJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $cabangId,
        public string $tanggalAwal,
        public string $tanggalAkhir,
        public string $penggunaId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Job asynchronous pemrosesan berkas laporan besar
    }
}

