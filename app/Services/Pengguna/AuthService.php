<?php

namespace App\Services\Pengguna;

use App\Models\Pengguna;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Autentikasi pengguna dan rotasi sesi SPA.
     */
    public function masuk(string $email, string $password, bool $ingatSaya = false): Pengguna
    {
        $pengguna = Pengguna::with(['peran.izin', 'cabang'])
            ->where('email', $email)
            ->first();

        if (! $pengguna || ! Hash::check($password, $pengguna->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kombinasi email dan kata sandi tidak cocok.'],
            ]);
        }

        if (! $pengguna->aktif) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda telah dinonaktifkan. Hubungi administrator toko.'],
            ]);
        }

        // Login ke session guard
        Auth::login($pengguna, $ingatSaya);
        request()->session()->regenerate();

        AuditService::catat('LOGIN', 'pengguna', $pengguna->id, null, [
            'email' => $pengguna->email,
            'waktu' => now()->toIso8601String(),
        ], $pengguna->cabang_id, $pengguna->id);

        return $pengguna;
    }

    /**
     * Logout pengguna dan invalidate session.
     */
    public function keluar(): void
    {
        $pengguna = Auth::user();

        if ($pengguna) {
            AuditService::catat('LOGOUT', 'pengguna', $pengguna->id, null, [
                'waktu' => now()->toIso8601String(),
            ], $pengguna->cabang_id, $pengguna->id);
        }

        Auth::guard('web')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }

    /**
     * Ambil data pengguna yang sedang login beserta peran dan cabang.
     */
    public function saya(): ?Pengguna
    {
        /** @var Pengguna|null $pengguna */
        $pengguna = Auth::user();

        if ($pengguna) {
            $pengguna->load(['peran.izin', 'cabang']);
        }

        return $pengguna;
    }
}

