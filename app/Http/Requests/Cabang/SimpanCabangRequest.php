<?php

namespace App\Http\Requests\Cabang;

use Illuminate\Foundation\Http\FormRequest;

class SimpanCabangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Cabang::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'kode' => ['required', 'string', 'max:20', 'unique:cabang,kode'],
            'nama' => ['required', 'string', 'max:100'],
            'alamat' => ['nullable', 'string'],
            'telepon' => ['nullable', 'string', 'max:30'],
            'zona_waktu' => ['nullable', 'string', 'max:50'],
            'aktif' => ['nullable', 'boolean'],
        ];
    }
}

