<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pengguna\SimpanPenggunaRequest;
use App\Http\Requests\Pengguna\UbahPenggunaRequest;
use App\Models\Pengguna;
use App\Services\Pengguna\PenggunaService;
use App\Support\Paginasi;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenggunaController extends Controller
{
    public function __construct(
        protected PenggunaService $penggunaService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Pengguna::class);

        $cabangId = $request->query('cabang_id');
        // Jika bukan pemilik, kunci ke cabang pengguna sendiri
        if (! $request->user()->punyaPeran('pemilik')) {
            $cabangId = $request->user()->cabang_id;
        }

        $daftar = $this->penggunaService->daftar(
            $cabangId,
            $request->query('q'),
            Paginasi::perHalaman($request, 15)
        );

        return ResponsApi::pagination($daftar, 'Daftar pengguna berhasil dimuat.');
    }

    public function store(SimpanPenggunaRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Scope cabang otomatis jika bukan pemilik
        if (! $request->user()->punyaPeran('pemilik')) {
            $data['cabang_id'] = $request->user()->cabang_id;
        }

        $pengguna = $this->penggunaService->buat($data);

        return ResponsApi::sukses($pengguna, 'Pengguna baru berhasil ditambahkan.', 201);
    }

    public function show(Pengguna $pengguna): JsonResponse
    {
        $this->authorize('view', $pengguna);

        return ResponsApi::sukses($pengguna->load(['peran', 'cabang']), 'Detail pengguna berhasil dimuat.');
    }

    public function update(UbahPenggunaRequest $request, Pengguna $pengguna): JsonResponse
    {
        $data = $request->validated();

        // Cegah perubahan cabang oleh non-pemilik
        if (! $request->user()->punyaPeran('pemilik')) {
            unset($data['cabang_id']);
        }

        $terbarui = $this->penggunaService->perbarui($pengguna, $data);

        return ResponsApi::sukses($terbarui, 'Data pengguna berhasil diperbarui.');
    }
}

