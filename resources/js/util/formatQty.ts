/**
 * Format string desimal kuantitas agar tampil bersih di antarmuka kasir
 * Contoh: "0.275" -> "0,275", "2.000" -> "2"
 */
export function formatQty(qty: string | number | null | undefined, satuan: string = ''): string {
    if (qty === null || qty === undefined || qty === '') {
        return `0 ${satuan}`.trim();
    }

    const nilai = typeof qty === 'string' ? parseFloat(qty) : qty;

    if (isNaN(nilai)) {
        return `0 ${satuan}`.trim();
    }

    // Format dengan titik/koma Indonesia, hapus trailing zeros tidak perlu
    const terformat = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    }).format(nilai);

    return satuan ? `${terformat} ${satuan}` : terformat;
}

