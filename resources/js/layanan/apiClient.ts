import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export interface ResponsApiFormat<T = any> {
    sukses: boolean;
    pesan: string;
    data: T;
    meta?: {
        waktu_server?: string;
        id_korelasi?: string;
        halaman_sekarang?: number;
        total_halaman?: number;
        total_data?: number;
        per_halaman?: number;
    };
    detail?: Record<string, string[]>;
    kode_error?: string;
}

export const apiClient: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

// Interceptor untuk menyertakan token CSRF jika tersedia di cookie
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Ambil XSRF-TOKEN dari cookie bila ada
    const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
    if (match && config.headers) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[2]);
    }
    return config;
});

export const EVENT_SESI_BERAKHIR = 'kebunkita:sesi-berakhir';

// Sesi kedaluwarsa: beritahu aplikasi agar kembali ke halaman masuk.
// Endpoint auth dikecualikan karena 401 di sana berarti kredensial salah / belum masuk.
apiClient.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
        const url = error.config?.url ?? '';
        if (error.response?.status === 401 && !url.startsWith('/auth/')) {
            window.dispatchEvent(new Event(EVENT_SESI_BERAKHIR));
        }
        return Promise.reject(error);
    }
);

// Helper untuk inisialisasi CSRF cookie dari Laravel Sanctum
export async function ambilCsrfCookie(): Promise<void> {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

export function ekstrakPesanError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const axErr = error as AxiosError<ResponsApiFormat>;
        const detailValidasi = axErr.response?.data?.detail;
        if (axErr.response?.status === 422 && detailValidasi) {
            const pesanPertama = Object.values(detailValidasi)[0]?.[0];
            if (pesanPertama) return pesanPertama;
        }
        if (axErr.response?.data?.pesan) {
            return axErr.response.data.pesan;
        }
        if (axErr.response?.status === 401) {
            return 'Sesi login telah berakhir. Silakan masuk kembali.';
        }
        if (axErr.response?.status === 403) {
            return 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.';
        }
        if (axErr.response?.status === 404) {
            return 'Data atau layanan yang diminta tidak ditemukan.';
        }
        if (axErr.response?.status === 409) {
            return 'Terjadi konflik data (harga atau stok telah berubah).';
        }
        if (axErr.response?.status === 422) {
            const detail = axErr.response.data.detail;
            if (detail) {
                const firstKey = Object.keys(detail)[0];
                return detail[firstKey][0] || 'Validasi data gagal.';
            }
            return 'Data yang dikirimkan tidak memenuhi persyaratan validasi.';
        }
        if (axErr.response?.status === 429) {
            return 'Terlalu banyak permintaan. Mohon tunggu sejenak.';
        }
    }
    return 'Terjadi kesalahan sistem. Silakan coba lagi.';
}

