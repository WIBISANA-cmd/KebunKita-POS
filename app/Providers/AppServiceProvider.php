<?php

namespace App\Providers;

use App\Services\Pembayaran\GatewayAdapterInterface;
use App\Services\Pembayaran\ProduksiGatewayAdapter;
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
        //
    }
}
