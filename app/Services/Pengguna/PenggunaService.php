<?php

namespace App\Services\Pengguna;

use App\Models\Pengguna;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PenggunaService
{
    /**
     * Ambil daftar pengguna dengan filter cabang dan pencarian nama/email.
     */
    public function daftar(?string $cabangId = null, ?string $q = null, int $perHalaman = 15): LengthAwarePaginator
    {
        $query = Pengguna::with(['peran', 'cabang'])
            ->orderBy('nama', 'asc')
            ->orderBy('id');

        if ($cabangId) {
            $query->where('cabang_id', $cabangId);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%");
            });
        }

        return $query->paginate($perHalaman);
    }

    /**
     * Tambah pengguna baru.
     */
    public function buat(array $data): Pengguna
    {
        return DB::transaction(function () use ($data) {
            $pengguna = Pengguna::create([
                'cabang_id' => $data['cabang_id'] ?? null,
                'nama' => $data['nama'],
                'email' => strtolower(trim($data['email'])),
                'password' => Hash::make($data['password']),
                'telepon' => $data['telepon'] ?? null,
                'aktif' => $data['aktif'] ?? true,
            ]);

            if (! empty($data['peran_ids'])) {
                foreach ($data['peran_ids'] as $peranId) {
                    $pengguna->peran()->attach($peranId, [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'cabang_id' => $pengguna->cabang_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            AuditService::catat('BUAT', 'pengguna', $pengguna->id, null, [
                'nama' => $pengguna->nama,
                'email' => $pengguna->email,
            ]);

            return $pengguna->load(['peran', 'cabang']);
        });
    }

    /**
     * Perbarui data pengguna.
     */
    public function perbarui(Pengguna $pengguna, array $data): Pengguna
    {
        return DB::transaction(function () use ($pengguna, $data) {
            $dataLama = $pengguna->only(['nama', 'email', 'cabang_id', 'telepon', 'aktif']);

            $update = [
                'nama' => $data['nama'] ?? $pengguna->nama,
                'telepon' => array_key_exists('telepon', $data) ? $data['telepon'] : $pengguna->telepon,
                'aktif' => array_key_exists('aktif', $data) ? (bool) $data['aktif'] : $pengguna->aktif,
            ];

            if (! empty($data['cabang_id'])) {
                $update['cabang_id'] = $data['cabang_id'];
            }

            if (! empty($data['email'])) {
                $update['email'] = strtolower(trim($data['email']));
            }

            if (! empty($data['password'])) {
                $update['password'] = Hash::make($data['password']);
            }

            $pengguna->update($update);

            if (isset($data['peran_ids'])) {
                $syncData = [];
                foreach ($data['peran_ids'] as $peranId) {
                    $syncData[$peranId] = [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'cabang_id' => $pengguna->cabang_id,
                    ];
                }
                $pengguna->peran()->sync($syncData);
            }

            AuditService::catat('UBAH', 'pengguna', $pengguna->id, $dataLama, $pengguna->only(['nama', 'email', 'cabang_id', 'telepon', 'aktif']));

            return $pengguna->load(['peran', 'cabang']);
        });
    }
}

