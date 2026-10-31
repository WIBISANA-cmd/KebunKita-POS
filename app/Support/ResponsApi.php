<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ResponsApi
{
    public static function sukses(mixed $data = null, string $pesan = 'Operasi berhasil diproses.', int $status = 200, array $meta = []): JsonResponse
    {
        $payload = [
            'sukses' => true,
            'pesan' => $pesan,
            'data' => $data,
            'meta' => array_merge([
                'waktu_server' => now()->toIso8601String(),
            ], $meta),
        ];

        return response()->json($payload, $status);
    }

    public static function pagination($paginator, string $pesan = 'Daftar data berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'sukses' => true,
            'pesan' => $pesan,
            'data' => $paginator->items(),
            'meta' => [
                'halaman_sekarang' => $paginator->currentPage(),
                'total_halaman' => $paginator->lastPage(),
                'total_data' => $paginator->total(),
                'per_halaman' => $paginator->perPage(),
                'waktu_server' => now()->toIso8601String(),
            ],
            'links' => [
                'pertama' => $paginator->url(1),
                'terakhir' => $paginator->url($paginator->lastPage()),
                'sebelumnya' => $paginator->previousPageUrl(),
                'selanjutnya' => $paginator->nextPageUrl(),
            ],
        ], 200);
    }

    public static function error(string $kodeError, string $pesan, int $status = 400, ?array $detail = null): JsonResponse
    {
        $payload = [
            'sukses' => false,
            'kode_error' => $kodeError,
            'pesan' => $pesan,
            'meta' => [
                'waktu_server' => now()->toIso8601String(),
            ],
        ];

        if ($detail !== null) {
            $payload['detail'] = $detail;
        }

        return response()->json($payload, $status);
    }
}

