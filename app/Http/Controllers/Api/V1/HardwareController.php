<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Hardware\TimbanganHardwareAdapter;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;

class HardwareController extends Controller
{
    public function __construct(
        protected TimbanganHardwareAdapter $timbanganAdapter
    ) {}

    public function statusTimbangan(): JsonResponse
    {
        $status = $this->timbanganAdapter->statusKoneksi();

        return ResponsApi::sukses($status, 'Status perangkat timbangan.');
    }

    public function bacaTimbangan(): JsonResponse
    {
        $baca = $this->timbanganAdapter->bacaData();

        return ResponsApi::sukses($baca, 'Baca stream berat timbangan.');
    }
}

