<?php

use App\Http\Middleware\HeaderKeamanan;
use App\Http\Middleware\ScopeCabangAktif;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->trustProxies(at: '*');
        $middleware->append(HeaderKeamanan::class);
        $middleware->alias([
            'scope.cabang' => ScopeCabangAktif::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'sukses' => false,
                    'kode_error' => 'VALIDASI_GAGAL',
                    'pesan' => 'Data yang dikirim tidak memenuhi persyaratan validasi.',
                    'detail' => $e->errors(),
                    'meta' => [
                        'waktu_server' => now()->toIso8601String(),
                    ],
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'sukses' => false,
                    'kode_error' => 'BELUM_TERAUTENTIKASI',
                    'pesan' => 'Sesi login telah berakhir atau Anda belum terautentikasi.',
                    'meta' => [
                        'waktu_server' => now()->toIso8601String(),
                    ],
                ], 401);
            }
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'sukses' => false,
                    'kode_error' => 'AKSES_DITOLAK',
                    'pesan' => $e->getMessage() ?: 'Anda tidak memiliki hak akses untuk melakukan aksi ini.',
                    'meta' => [
                        'waktu_server' => now()->toIso8601String(),
                    ],
                ], 403);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'sukses' => false,
                    'kode_error' => 'DATA_TIDAK_DITEMUKAN',
                    'pesan' => 'Data atau rute yang diminta tidak ditemukan.',
                    'meta' => [
                        'waktu_server' => now()->toIso8601String(),
                    ],
                ], 404);
            }
        });

        $exceptions->render(function (ConflictHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'sukses' => false,
                    'kode_error' => 'KONFLIK_DATA',
                    'pesan' => $e->getMessage() ?: 'Terjadi konflik data atau versi transaksi telah berubah.',
                    'meta' => [
                        'waktu_server' => now()->toIso8601String(),
                    ],
                ], 409);
            }
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'sukses' => false,
                    'kode_error' => 'BATAS_PERMINTAAN_TERLAMPAUI',
                    'pesan' => 'Terlalu banyak permintaan. Silakan coba kembali beberapa saat lagi.',
                    'meta' => [
                        'waktu_server' => now()->toIso8601String(),
                    ],
                ], 429);
            }
        });
    })->create();
