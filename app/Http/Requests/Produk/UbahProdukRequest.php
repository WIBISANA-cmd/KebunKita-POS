<?php

namespace App\Http\Requests\Produk;

use Illuminate\Foundation\Http\FormRequest;

class UbahProdukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kategori_produk_id' => ['sometimes', 'uuid', 'exists:kategori_produk,id'],
            'nama' => ['sometimes', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'foto_url' => ['nullable', 'string', 'max:255'],
            'stok_minimum' => ['nullable', 'numeric', 'min:0'],
            'harga_rp' => ['nullable', 'numeric', 'min:0'],
            'aktif' => ['nullable', 'boolean'],
        ];
    }
}

