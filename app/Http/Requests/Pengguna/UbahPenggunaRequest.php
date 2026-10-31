<?php

namespace App\Http\Requests\Pengguna;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UbahPenggunaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $pengguna = $this->route('pengguna');
        return $pengguna && $this->user()?->can('update', $pengguna);
    }

    public function rules(): array
    {
        $penggunaId = $this->route('pengguna')?->id;

        return [
            'cabang_id' => ['nullable', 'uuid', 'exists:cabang,id'],
            'nama' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'string', 'email', 'max:150', Rule::unique('pengguna', 'email')->ignore($penggunaId)],
            'password' => ['nullable', 'string', 'min:8'],
            'telepon' => ['nullable', 'string', 'max:30'],
            'aktif' => ['nullable', 'boolean'],
            'peran_ids' => ['nullable', 'array'],
            'peran_ids.*' => ['uuid', 'exists:peran,id'],
        ];
    }
}

