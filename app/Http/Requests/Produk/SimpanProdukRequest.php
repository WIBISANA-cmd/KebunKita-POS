<?php

namespace App\Http\Requests\Produk;

use Illuminate\Foundation\Http\FormRequest;

class SimpanProdukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kategori_produk_id' => ['required', 'uuid', 'exists:kategori_produk,id'],
            'satuan_dasar_id' => ['required', 'uuid', 'exists:satuan,id'],
            'sku' => ['required', 'string', 'max:50', 'unique:produk,sku'],
            'nama' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'tipe_jual' => ['required', 'in:timbang,satuan'],
            'foto_url' => ['nullable', 'string', 'max:255'],
            'stok_minimum' => ['nullable', 'numeric', 'min:0'],
            'harga_rp' => ['nullable', 'numeric', 'min:0'],
            'barcode' => ['nullable', 'string', 'max:50', 'unique:satuan_produk,barcode'],
            'aktif' => ['nullable', 'boolean'],
            'satuan_tambahan' => ['nullable', 'array'],
            'satuan_tambahan.*.satuan_id' => ['required_with:satuan_tambahan', 'uuid', 'exists:satuan,id'],
            'satuan_tambahan.*.faktor_ke_dasar' => ['required_with:satuan_tambahan', 'numeric', 'gt:0'],
            'satuan_tambahan.*.harga_rp' => ['nullable', 'numeric', 'min:0'],
            'satuan_tambahan.*.barcode' => ['nullable', 'string', 'max:50'],
        ];
    }
}

