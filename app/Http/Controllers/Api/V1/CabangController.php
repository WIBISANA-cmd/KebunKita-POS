<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cabang\SimpanCabangRequest;
use App\Models\Cabang;
use App\Services\Pengguna\CabangService;
use App\Support\ResponsApi;
use Illuminate\Http\JsonResponse;

class CabangController extends Controller
{
    public function __construct(
        protected CabangService $cabangService
    ) {}

    public function index(): JsonResponse
    {
        $semua = $this->cabangService->semua();

        return ResponsApi::sukses($semua, 'Daftar cabang toko berhasil dimuat.');
    }

    public function store(SimpanCabangRequest $request): JsonResponse
    {
        $cabang = $this->cabangService->buat($request->validated());

        return ResponsApi::sukses($cabang, 'Cabang baru berhasil dibuat.', 201);
    }

    public function show(Cabang $cabang): JsonResponse
    {
        $this->authorize('view', $cabang);

        return ResponsApi::sukses($cabang, 'Detail cabang berhasil dimuat.');
    }
}

