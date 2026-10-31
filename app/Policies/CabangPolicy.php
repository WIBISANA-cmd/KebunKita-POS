<?php

namespace App\Policies;

use App\Models\Cabang;
use App\Models\Pengguna;

class CabangPolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true;
    }

    public function view(Pengguna $user, Cabang $cabang): bool
    {
        if ($user->punyaPeran('pemilik')) {
            return true;
        }

        return $user->cabang_id === $cabang->id;
    }

    public function create(Pengguna $user): bool
    {
        return $user->punyaPeran('pemilik');
    }

    public function update(Pengguna $user, Cabang $cabang): bool
    {
        return $user->punyaPeran('pemilik');
    }

    public function delete(Pengguna $user, Cabang $cabang): bool
    {
        return $user->punyaPeran('pemilik');
    }
}

