/**
 * Format string atau number nominal ke format standar mata uang Rupiah Indonesia (id-ID)
 * Contoh: "18000" -> "Rp 18.000"
 */
export function formatRupiah(nominal: string | number | null | undefined): string {
    if (nominal === null || nominal === undefined || nominal === '') {
        return 'Rp 0';
    }

    const nilai = typeof nominal === 'string' ? parseFloat(nominal) : nominal;

    if (isNaN(nilai)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(nilai).replace('IDR', 'Rp');
}

