<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\CrmDeal;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Reports/Index');
    }

    public function overview(Request $request): JsonResponse
    {
        $days = (int) $request->integer('days', 7);
        $days = max(1, min($days, 90));

        $from = now()->startOfDay()->subDays($days - 1);
        $to = now()->endOfDay();

        $kpis = $this->buildKpis($from, $to);
        $volumeByChannel = $this->buildVolumeByChannel($from, $to);
        $avgHandleByDay = $this->buildAverageHandleByDay($from, $to);

        return response()->json([
            'success' => true,
            'range' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
                'days' => $days,
            ],
            'kpis' => $kpis,
            'volumeByChannel' => $volumeByChannel,
            'avgHandleByDay' => $avgHandleByDay,
        ]);
    }

    private function buildKpis(Carbon $from, Carbon $to): array
    {
        $newLeads = Contact::whereBetween('created_at', [$from, $to])->count();
        $attendances = Conversation::whereBetween('created_at', [$from, $to])->count();

        $resolvedConversations = Conversation::whereBetween('created_at', [$from, $to])
            ->whereNotNull('last_message_at')
            ->get(['created_at', 'last_message_at']);

        $avgHandleMinutes = $resolvedConversations->avg(function ($conversation) {
            return max(0, Carbon::parse($conversation->created_at)->diffInMinutes(Carbon::parse($conversation->last_message_at)));
        }) ?? 0;

        $deals = CrmDeal::with('stage:id,name')
            ->whereBetween('created_at', [$from, $to])
            ->get();

        $wonDeals = $deals->filter(function (CrmDeal $deal) {
            $stageName = mb_strtolower((string) optional($deal->stage)->name);
            return str_contains($stageName, 'ganho') || str_contains($stageName, 'won');
        })->count();

        $conversionRate = $deals->count() > 0 ? round(($wonDeals / $deals->count()) * 100, 1) : 0.0;

        return [
            'newLeads' => $newLeads,
            'attendances' => $attendances,
            'avgHandleMinutes' => round($avgHandleMinutes, 1),
            'conversionRate' => $conversionRate,
        ];
    }

    private function buildVolumeByChannel(Carbon $from, Carbon $to): array
    {
        $conversations = Conversation::whereBetween('created_at', [$from, $to])
            ->get(['channel', 'created_at']);

        $days = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $label = $cursor->format('d/m');
            $days[$label] = [
                'name' => $label,
                'whatsapp' => 0,
                'instagram' => 0,
                'webchat' => 0,
            ];
            $cursor->addDay();
        }

        foreach ($conversations as $conversation) {
            $label = Carbon::parse($conversation->created_at)->format('d/m');
            if (!isset($days[$label])) {
                continue;
            }

            $channel = mb_strtolower((string) $conversation->channel);
            if ($channel === 'whatsapp') {
                $days[$label]['whatsapp']++;
            } elseif ($channel === 'instagram') {
                $days[$label]['instagram']++;
            } else {
                $days[$label]['webchat']++;
            }
        }

        return array_values($days);
    }

    private function buildAverageHandleByDay(Carbon $from, Carbon $to): array
    {
        $conversations = Conversation::whereBetween('created_at', [$from, $to])
            ->whereNotNull('last_message_at')
            ->get(['created_at', 'last_message_at']);

        $days = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $label = $cursor->format('d/m');
            $days[$label] = [
                'name' => $label,
                'sum' => 0,
                'count' => 0,
            ];
            $cursor->addDay();
        }

        foreach ($conversations as $conversation) {
            $label = Carbon::parse($conversation->created_at)->format('d/m');
            if (!isset($days[$label])) {
                continue;
            }

            $diff = max(0, Carbon::parse($conversation->created_at)->diffInMinutes(Carbon::parse($conversation->last_message_at)));
            $days[$label]['sum'] += $diff;
            $days[$label]['count']++;
        }

        return array_map(function (array $day) {
            $avg = $day['count'] > 0 ? round($day['sum'] / $day['count'], 1) : 0;
            return [
                'name' => $day['name'],
                'avg_minutes' => $avg,
            ];
        }, array_values($days));
    }
}
