<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\MasukRequest;
use App\Services\Pengguna\AuthService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function masuk(MasukRequest $request): JsonResponse
    {
        $pengguna = $this->authService->masuk(
            $request->validated('email'),
            $request->validated('password'),
            (bool) $request->validated('ingat_saya', false)
        );

        return ResponsApi::sukses([
            'pengguna' => $pengguna,
            'cabang' => $pengguna->cabang,
        ], 'Berhasil masuk ke dalam sistem.');
    }

    public function keluar(): JsonResponse
    {
        $this->authService->keluar();

        return ResponsApi::sukses(null, 'Berhasil keluar dari sistem.');
    }

    public function saya(): JsonResponse
    {
        $pengguna = $this->authService->saya();

        if (! $pengguna) {
            return ResponsApi::sukses(null, 'Belum ada pengguna yang masuk.');
        }

        return ResponsApi::sukses([
            'pengguna' => $pengguna,
            'cabang' => $pengguna->cabang,
            'shift_aktif' => null, // akan dihubungkan dengan ShiftKasirService di M05
        ], 'Informasi sesi aktif berhasil diambil.');
    }
}

