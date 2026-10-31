export interface Cabang {
    id: string;
    kode: string;
    nama: string;
    alamat: string | null;
    telepon: string | null;
    zona_waktu: string;
    aktif: boolean;
}

export interface Pengguna {
    id: string;
    nama: string;
    email: string;
    telepon: string | null;
    aktif: boolean;
    peran?: Peran[];
    cabang_id?: string | null;
    cabang?: Cabang | null;
}

export interface Peran {
    id: string;
    kode: string;
    nama: string;
    deskripsi: string | null;
    izin?: Izin[];
}

export interface Izin {
    id: string;
    kode: string;
    nama: string;
}

export interface KategoriProduk {
    id: string;
    nama: string;
    induk_id: string | null;
    urutan: number;
    aktif: boolean;
    jumlah_produk?: number;
}

export interface Satuan {
    id: string;
    kode: string;
    nama: string;
    jenis: string;
}

export interface SatuanProduk {
    id: string;
    produk_id: string;
    satuan_id: string;
    faktor_ke_dasar: string;
    barcode: string | null;
    bisa_dijual: boolean;
    bisa_dibeli: boolean;
    satuan?: Satuan;
    harga_aktif?: HargaProduk | null;
}

export interface HargaProduk {
    id: string;
    satuan_produk_id: string;
    cabang_id: string | null;
    jenis_harga: 'reguler' | 'grosir' | 'promo';
    harga_rp: string;
    mulai_pada: string;
    akhir_pada: string | null;
}

export interface Produk {
    id: string;
    kategori_produk_id: string;
    satuan_dasar_id: string;
    sku: string;
    nama: string;
    deskripsi: string | null;
    tipe_jual: 'timbang' | 'satuan';
    foto_url: string | null;
    stok_minimum: string;
    aktif: boolean;
    kategori?: KategoriProduk;
    satuan_dasar?: Satuan;
    satuan_produk?: SatuanProduk[];
    total_stok_dasar?: string;
}

export interface Pemasok {
    id: string;
    nama: string;
    kontak: string | null;
    telepon: string | null;
    alamat: string | null;
    aktif: boolean;
}

export interface Pelanggan {
    id: string;
    nama: string;
    telepon: string | null;
    email: string | null;
    alamat: string | null;
    poin: number;
    aktif: boolean;
}

export interface LokasiStok {
    id: string;
    cabang_id: string;
    kode: string;
    nama: string;
    tipe: 'gudang' | 'rak_toko' | 'retur';
}

export interface SaldoStok {
    id: string;
    produk_id: string;
    lokasi_stok_id: string;
    qty_dasar: string;
    produk?: Produk;
    lokasi?: LokasiStok;
}

export interface LotStok {
    id: string;
    produk_id: string;
    lokasi_stok_id: string;
    item_terima_id: string | null;
    kode_lot: string;
    qty_awal: string;
    qty_sisa: string;
    hpp_dasar: string;
    kedaluwarsa_pada: string | null;
    produk?: Produk;
    lokasi?: LokasiStok;
}

export interface MutasiStok {
    id: string;
    dokumen_stok_id: string;
    produk_id: string;
    lokasi_stok_id: string;
    lot_stok_id: string | null;
    qty_delta: string;
    nilai_hpp_rp: string;
    keterangan: string | null;
    dibuat_pada?: string;
    created_at?: string;
    produk?: Produk;
    lokasi?: LokasiStok;
    dokumen?: {
        id?: string;
        nomor?: string;
        jenis?: string;
    };
    lot?: LotStok;
}

export interface PesananBeli {
    id: string;
    cabang_id: string;
    pemasok_id: string;
    nomor: string;
    status: 'draft' | 'disetujui' | 'diterima_sebagian' | 'diterima_penuh' | 'batal';
    total_rp: string;
    catatan: string | null;
    dibuat_pada: string;
    pemasok?: Pemasok;
    items?: ItemBeli[];
}

export interface ItemBeli {
    id: string;
    pesanan_beli_id: string;
    produk_id: string;
    satuan_produk_id: string;
    qty: string;
    harga_rp: string;
    subtotal_rp: string;
    qty_diterima?: string;
    produk?: Produk;
    satuan_produk?: SatuanProduk;
}

export interface TerimaBeli {
    id: string;
    pesanan_beli_id: string;
    lokasi_stok_id: string;
    nomor: string;
    waktu_terima: string;
    penerima_id: string;
    items?: ItemTerima[];
    pesanan_beli?: PesananBeli;
}

export interface ItemTerima {
    id: string;
    terima_beli_id: string;
    item_beli_id: string;
    qty_diterima: string;
    biaya_satuan_rp: string;
    kedaluwarsa_pada: string | null;
    item_beli?: ItemBeli;
}

export interface ShiftKasir {
    id: string;
    cabang_id: string;
    pengguna_id: string;
    waktu_buka: string;
    waktu_tutup: string | null;
    modal_awal_rp: string;
    saldo_sistem_rp: string;
    saldo_fisik_rp: string | null;
    selisih_rp: string | null;
    catatan_selisih: string | null;
    status: 'buka' | 'tutup';
    pengguna?: Pengguna;
    cabang?: Cabang;
}

export interface ItemKeranjang {
    satuan_produk_id: string;
    produk: Produk;
    satuan_produk: SatuanProduk;
    qty: string; // contoh: "0.275" atau "2"
    harga_satuan_rp: string;
    diskon_item_rp: string;
    subtotal_rp: string;
    catatan?: string;
}

export interface MetodeBayar {
    id: string;
    kode: string;
    nama: string;
    jenis: 'tunai' | 'transfer' | 'qris' | 'kartu';
    aktif: boolean;
}

export interface Penjualan {
    id: string;
    cabang_id: string;
    shift_kasir_id: string;
    pelanggan_id: string | null;
    nomor: string;
    waktu_penjualan: string;
    status: 'draft' | 'menunggu_bayar' | 'selesai' | 'batal' | 'retur_sebagian' | 'retur_penuh';
    subtotal_rp: string;
    diskon_rp: string;
    pajak_rp: string;
    total_rp: string;
    hpp_total_rp: string;
    pelanggan?: Pelanggan | null;
    items?: ItemJual[];
    pembayaran?: BayarJual[];
    cabang?: Cabang;
    shift_kasir?: ShiftKasir;
}

export interface ItemJual {
    id: string;
    penjualan_id: string;
    produk_id: string;
    satuan_produk_id: string;
    nama_snapshot: string;
    satuan_snapshot?: string;
    qty: string;
    harga_snapshot_rp: string;
    diskon_rp: string;
    total_rp: string;
    hpp_rp: string;
    satuan_produk?: SatuanProduk;
}

export interface BayarJual {
    id: string;
    penjualan_id: string;
    metode_bayar_id: string;
    nilai_rp: string;
    diterima_rp: string;
    kembalian_rp: string;
    status: 'sukses' | 'pending' | 'gagal';
    ref_eksternal: string | null;
    metode_bayar?: MetodeBayar;
}

export interface ReturJual {
    id: string;
    penjualan_id: string;
    nomor: string;
    waktu_retur: string;
    alasan: string;
    status: 'diproses' | 'selesai' | 'ditolak';
    total_refund_rp: string;
    penjualan?: Penjualan;
    items?: ItemRetur[];
}

export interface ItemRetur {
    id: string;
    retur_jual_id: string;
    item_jual_id: string;
    qty: string;
    nilai_refund_rp: string;
    layak_jual: boolean;
    item_jual?: ItemJual;
}

export interface RingkasanDashboard {
    omzet_bersih_rp: string;
    total_transaksi: number;
    laba_kotor_rp: string;
    margin_kotor_persen: number;
    produk_terjual: number;
    perubahan_persen: {
        omzet: number | null;
        transaksi: number | null;
        laba: number | null;
        produk: number | null;
    };
    stok_menipis_count: number;
    susut_rp: string;
    kas_aktif_rp: string;
    shift_terbuka: boolean;
}

export interface TransaksiNotifikasi {
    id: string;
    nomor: string;
    total_rp: string;
    jumlah_item: number;
    waktu_penjualan: string;
    pelanggan: string | null;
    kasir: string | null;
    metode_bayar: string | null;
}

export interface TrenPenjualan {
    label: string;
    tanggal: string;
    omzet_rp: string;
    laba_kotor_rp: string;
    total_transaksi: number;
}

export interface PangsaKategori {
    total_rp: string;
    kategori: {
        nama: string;
        omzet_rp: string;
        persen: number;
        perubahan_persen: number | null;
    }[];
}

export interface PangsaMetodeBayar {
    total_rp: string;
    metode: {
        jenis: string;
        nilai_rp: string;
        persen: number;
    }[];
}

export interface TopProdukDashboard {
    produk_id: string;
    nama_snapshot: string;
    satuan_snapshot: string;
    total_qty: string;
    total_omzet_rp: string;
}

export interface PengaturanToko {
    id: string;
    cabang_id: string | null;
    kunci: string;
    nilai_json: any;
}
