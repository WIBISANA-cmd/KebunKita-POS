<?php

namespace App\Services\Pengguna;

use App\Models\AuditAksi;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Catat aksi audit secara append-only untuk integritas operasional.
     */
    public static function catat(
        string $aksi,
        string $entitas,
        string $entitasId,
        ?array $dataLama = null,
        ?array $dataBaru = null,
        ?string $cabangId = null,
        ?string $penggunaId = null
    ): AuditAksi {
        return AuditAksi::create([
            'pengguna_id' => $penggunaId ?: auth()->id(),
            'cabang_id' => $cabangId ?: (auth()->user()?->cabang_id),
            'aksi' => strtoupper($aksi),
            'entitas' => $entitas,
            'entitas_id' => $entitasId,
            'data_lama' => $dataLama,
            'data_baru' => $dataBaru,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}

