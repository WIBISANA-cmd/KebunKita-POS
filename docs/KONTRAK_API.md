# KEBUN KITA POS — KONTRAK RESTful JSON API v1

**Status:** Ditetapkan  
**Versi API:** `/api/v1`  
**Format Pertukaran:** JSON (`application/json`)  
**Header Wajib:**
- `Accept: application/json`
- `Content-Type: application/json`
- `X-XSRF-TOKEN: <token>` (untuk request non-GET berbasis Sanctum session cookie)
- `Idempotency-Key: <uuid>` (wajib untuk endpoint mutasi transaksi: checkout, pembayaran, penerimaan barang, opname)

---

## 1. Standar Response Format

### Sukses (Single Item / Detail)
```json
{
  "sukses": true,
  "data": {
    "id": "0192e21b-8531-7b3f-b88a-360db9354e38",
    "nomor": "TRX-20261030-0001",
    "total_rp": "24950",
    "status": "selesai",
    "dibuat_pada": "2026-10-30T13:20:00Z"
  },
  "meta": {
    "waktu_server": "2026-10-30T13:20:05Z",
    "id_korelasi": "req-9a8f23bc-11"
  }
}
```

### Sukses (List / Paginated)
```json
{
  "sukses": true,
  "data": [ ... ],
  "meta": {
    "halaman_sekarang": 1,
    "total_halaman": 5,
    "total_data": 48,
    "per_halaman": 10,
    "waktu_server": "2026-10-30T13:20:05Z",
    "id_korelasi": "req-9a8f23bc-12"
  },
  "links": {
    "pertama": "/api/v1/produk?halaman=1",
    "terakhir": "/api/v1/produk?halaman=5",
    "sebelumnya": null,
    "selanjutnya": "/api/v1/produk?halaman=2"
  }
}
```

### Response Error Terstandar
```json
{
  "sukses": false,
  "kode_error": "VALIDASI_GAGAL",
  "pesan": "Data yang dikirim tidak memenuhi persyaratan validasi.",
  "detail": {
    "item.0.qty": [
      "Kuantitas item harus berupa angka lebih besar dari nol."
    ]
  },
  "meta": {
    "waktu_server": "2026-10-30T13:20:05Z",
    "id_korelasi": "req-9a8f23bc-13"
  }
}
```

---

## 2. Pemetaan Status HTTP & Kode Error

| Status HTTP | `kode_error` | Keterangan & Penanganan Frontend |
|---|---|---|
| `200 OK` | - | Permintaan berhasil diambil atau diproses. |
| `201 Created` | - | Entitas baru berhasil dibuat (mis. produk baru, PO baru). |
| `204 No Content` | - | Berhasil diproses tanpa konten balik. |
| `400 Bad Request` | `PERMINTAAN_TIDAK_VALID` | Format payload atau parameter URL keliru. |
| `401 Unauthorized` | `BELUM_TERAUTENTIKASI` | Sesi berakhir atau cookie tidak valid. Arahkan pengguna ke halaman login. |
| `403 Forbidden` | `AKSES_DITOLAK` | Pengguna tidak memiliki izin RBAC atau hak akses pada `cabang_id` target. |
| `404 Not Found` | `DATA_TIDAK_DITEMUKAN` | Resource tidak ada di database atau tidak berada dalam scope cabang. |
| `409 Conflict` | `KONFLIK_STOK_HARGA` | Terjadi perubahan harga atau stok tidak mencukupi saat proses checkout. Tampilkan modal dialog konfirmasi data terbaru. |
| `419 Page Expired`| `CSRF_TIDAK_VALID` | Token CSRF kedaluwarsa. Frontend melakukan refresh CSRF cookie otomatis lalu ulangi request. |
| `422 Unprocessable`| `VALIDASI_GAGAL` | Input tidak lolos FormRequest. Tampilkan pesan kesalahan per field input. |
| `429 Too Many Req`| `BATAS_REQUEST_TERLAMPAUI`| Rate limit terlampaui. Tampilkan pemberitahuan jeda waktu retry. |
| `500 Server Error`| `KESALAHAN_SERVER` | Terjadi kegagalan internal. Tampilkan notifikasi ramah tanpa membocorkan stacktrace internal. |

---

## 3. Aturan Desimal dan Nilai Moneter

1. **Format Serialisasi:**
   - Kuantitas desimal (`qty`) dikirim sebagai string desimal presisi tinggi: `"0.275"`, `"1.500"`.
   - Nilai moneter (`_rp`) dikirim sebagai string integer: `"18000"`, `"4950"`.
2. **Kalkulasi Frontend vs Backend:**
   - Frontend React HANYA menghitung estimasi/pratinjau untuk kenyamanan visual kasir.
   - Backend Laravel Service Layer menghitung ulang 100% nominal akhir transaksi secara otoritatif dari database dan mengembalikan angka resmi.

---

## 4. Format Tanggal & Zona Waktu

- Format pengiriman & penerimaan API: Standar ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).
- Contoh: `"2026-10-30T13:30:00Z"`.
- Konversi ke waktu lokal (`Asia/Jakarta`, WIB = UTC+7) dilakukan di UI formatter frontend (`Intl.DateTimeFormat`).

