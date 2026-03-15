<?php

namespace App\Jobs;

use App\Models\WebhookEvent;
use App\Services\EvolutionWebhookProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessEvolutionWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(public int $eventId)
    {
    }

    public function handle(EvolutionWebhookProcessor $processor): void
    {
        $event = WebhookEvent::find($this->eventId);

        if (!$event || $event->source !== 'evolution') {
            return;
        }

        $processor->process($event);
    }
}
