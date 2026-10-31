<?php

namespace App\Policies;

use App\Models\Pengguna;

class PenggunaPolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return $user->punyaIzin('pengguna.lihat') || $user->punyaPeran('pemilik') || $user->punyaPeran('manajer');
    }

    public function view(Pengguna $user, Pengguna $model): bool
    {
        if ($user->id === $model->id) {
            return true;
        }

        if ($user->punyaPeran('pemilik')) {
            return true;
        }

        return $user->punyaIzin('pengguna.lihat') && ($user->cabang_id === $model->cabang_id);
    }

    public function create(Pengguna $user): bool
    {
        return $user->punyaIzin('pengguna.kelola') || $user->punyaPeran('pemilik');
    }

    public function update(Pengguna $user, Pengguna $model): bool
    {
        if ($user->punyaPeran('pemilik')) {
            return true;
        }

        // Tidak boleh mengedit pengguna di cabang berbeda
        if ($user->cabang_id !== $model->cabang_id) {
            return false;
        }

        return $user->punyaIzin('pengguna.kelola');
    }

    public function delete(Pengguna $user, Pengguna $model): bool
    {
        // Hanya pemilik yang boleh menonaktifkan/menghapus
        return $user->punyaPeran('pemilik');
    }
}

