<?php

namespace App\Http\Middleware;

use App\Support\ResponsApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ScopeCabangAktif
{
    /**
     * Memastikan header X-Cabang-ID valid dan terlindungi dari eksploitasi BOLA/IDOR.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $cabangIdHeader = $request->header('X-Cabang-ID');

        // Jika user memiliki cabang_id spesifik (misal kasir cabang), pastikan tidak mengakses cabang lain
        if ($user->cabang_id && $cabangIdHeader && $user->cabang_id !== $cabangIdHeader) {
            // Periksa apakah user memiliki peran superadmin / pemilik yang diizinkan lintas cabang
            $isSuperAdmin = $user->peran()->where('kode', 'pemilik')->exists();
            if (! $isSuperAdmin) {
                return ResponsApi::error('Akses ditolak: Anda tidak memiliki otoritas pada cabang yang diminta.', 403);
            }
        }

        return $next($request);
    }
}

