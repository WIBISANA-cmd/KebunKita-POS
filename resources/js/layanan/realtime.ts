import { apiClient } from './apiClient';

export type StatusRealtime = 'menyambung' | 'terhubung' | 'terputus';

function bacaMeta(nama: string): string {
    return document.querySelector(`meta[name="${nama}"]`)?.getAttribute('content') ?? '';
}

/**
 * Berlangganan kanal privat cabang lewat Reverb. Pustaka WebSocket dimuat terpisah
 * supaya tidak membebani bundle awal. Mengembalikan fungsi untuk memutus sambungan.
 */
export function langgananTransaksiCabang<T>(
    cabangId: string,
    padaTransaksi: (transaksi: T) => void,
    padaStatus: (status: StatusRealtime) => void
): () => void {
    const kunciAplikasi = bacaMeta('reverb-key');
    if (!kunciAplikasi) {
        padaStatus('terputus');
        return () => {};
    }

    let dibatalkan = false;
    let putuskan = () => {};

    Promise.all([import('laravel-echo'), import('pusher-js')])
        .then(([{ default: Echo }, { default: Pusher }]) => {
            if (dibatalkan) return;

            const aman = window.location.protocol === 'https:';
            const port = Number(bacaMeta('reverb-port')) || Number(window.location.port) || (aman ? 443 : 80);

            const echo = new Echo({
                broadcaster: 'reverb',
                key: kunciAplikasi,
                wsHost: window.location.hostname,
                wsPort: port,
                wssPort: port,
                forceTLS: aman,
                enabledTransports: ['ws', 'wss'],
                Pusher,
                // Lewat apiClient agar token CSRF sesi ikut terkirim
                authorizer: (kanal: { name: string }) => ({
                    authorize: (
                        socketId: string,
                        selesai: (galat: Error | null, data: { auth: string } | null) => void
                    ) => {
                        apiClient
                            .post('/broadcasting/auth', { socket_id: socketId, channel_name: kanal.name }, { baseURL: '/' })
                            .then((res) => selesai(null, res.data))
                            .catch((err) => selesai(err, null));
                    },
                }),
            });

            echo.private(`cabang.${cabangId}`).listen('.penjualan.selesai', padaTransaksi);
            echo.connector.pusher.connection.bind('state_change', ({ current }: { current: string }) => {
                padaStatus(current === 'connected' ? 'terhubung' : current === 'connecting' ? 'menyambung' : 'terputus');
            });

            putuskan = () => echo.disconnect();
        })
        .catch(() => padaStatus('terputus'));

    return () => {
        dibatalkan = true;
        putuskan();
    };
}
