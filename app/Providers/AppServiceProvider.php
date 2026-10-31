<?php

namespace App\Providers;

use App\Services\Pembayaran\GatewayAdapterInterface;
use App\Services\Pembayaran\ProduksiGatewayAdapter;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(GatewayAdapterInterface::class, ProduksiGatewayAdapter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->ensurePostgresSchemaExists();
    }

    /**
     * Memastikan PostgreSQL schema yang dikonfigurasi pada DB_SCHEMA / search_path
     * otomatis dibuat jika belum ada saat menjalankan command artisan database (migrate, seed, dll).
     */
    protected function ensurePostgresSchemaExists(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        Event::listen(CommandStarting::class, function (CommandStarting $event) {
            $command = $event->command ?? '';
            if (! str_starts_with($command, 'migrate') && ! str_starts_with($command, 'db:')) {
                return;
            }

            try {
                $connection = config('database.default');
                if ($connection !== 'pgsql') {
                    return;
                }

                $searchPath = config('database.connections.pgsql.search_path', 'public');
                if (! $searchPath || $searchPath === 'public') {
                    return;
                }

                $schemas = array_map('trim', explode(',', (string) $searchPath));
                $primarySchema = $schemas[0] ?? '';

                if ($primarySchema !== '' && $primarySchema !== 'public') {
                    $sanitized = preg_replace('/[^a-zA-Z0-9_]/', '', $primarySchema);
                    if (! empty($sanitized)) {
                        DB::connection('pgsql')->statement("CREATE SCHEMA IF NOT EXISTS \"{$sanitized}\"");
                    }
                }
            } catch (\Throwable $e) {
                // Jangan menghentikan command bila koneksi database belum tersedia
            }
        });
    }
}
