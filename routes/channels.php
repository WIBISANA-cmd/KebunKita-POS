<?php

use App\Models\Pengguna;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('cabang.{cabangId}', function (Pengguna $pengguna, string $cabangId): bool {
    return $pengguna->cabang_id === $cabangId || $pengguna->punyaPeran('pemilik');
});
