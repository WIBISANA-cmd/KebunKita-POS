<?php

namespace App\Events;

use App\Models\Penjualan;
use App\Services\Penjualan\NotifikasiTransaksiService;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class PenjualanSelesai implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public Penjualan $penjualan
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("cabang.{$this->penjualan->cabang_id}")];
    }

    public function broadcastAs(): string
    {
        return 'penjualan.selesai';
    }

    public function broadcastWith(): array
    {
        return app(NotifikasiTransaksiService::class)->ringkas($this->penjualan);
    }
}
