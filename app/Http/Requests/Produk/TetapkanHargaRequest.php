<?php

namespace App\Http\Requests\Produk;

use Illuminate\Foundation\Http\FormRequest;

class TetapkanHargaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'satuan_produk_id' => ['required', 'uuid', 'exists:satuan_produk,id'],
            'cabang_id' => ['nullable', 'uuid', 'exists:cabang,id'],
            'jenis_harga' => ['required', 'in:reguler,grosir,promo'],
            'harga_rp' => ['required', 'numeric', 'min:0'],
            'mulai_pada' => ['required', 'date'],
            'akhir_pada' => ['nullable', 'date', 'after:mulai_pada'],
        ];
    }
}

