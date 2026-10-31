<?php

namespace App\Http\Requests\Pengguna;

use Illuminate\Foundation\Http\FormRequest;

class SimpanPenggunaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Pengguna::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'cabang_id' => ['nullable', 'uuid', 'exists:cabang,id'],
            'nama' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:pengguna,email'],
            'password' => ['required', 'string', 'min:8'],
            'telepon' => ['nullable', 'string', 'max:30'],
            'aktif' => ['nullable', 'boolean'],
            'peran_ids' => ['nullable', 'array'],
            'peran_ids.*' => ['uuid', 'exists:peran,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama pengguna wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ];
    }
}

