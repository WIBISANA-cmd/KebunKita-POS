<?php

namespace App\Services\Hardware;

interface HardwareAdapterInterface
{
    public function bacaData(): array;
    public function statusKoneksi(): array;
}

