<?php

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\CrmDeal;
use App\Models\CrmFunnel;
use App\Models\CrmStage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@cfauto.com.br'],
            ['name' => 'Admin CF Auto', 'password' => Hash::make('password')]
        );

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => Hash::make('password')]
        );

        // ─────────────── CRM Funnel ───────────────
        $funnel = CrmFunnel::firstOrCreate(
            ['name' => 'Funil de Vendas CF Auto'],
            ['description' => 'Pipeline principal de vendas de veículos', 'is_active' => true]
        );

        $stages = [
            ['name' => 'Novo Lead',       'order_index' => 0, 'color' => '#6366f1'],
            ['name' => 'Em Negociação',   'order_index' => 1, 'color' => '#f59e0b'],
            ['name' => 'Proposta Enviada','order_index' => 2, 'color' => '#3b82f6'],
            ['name' => 'Fechado - Ganho', 'order_index' => 3, 'color' => '#10b981'],
            ['name' => 'Fechado - Perdido','order_index'=> 4, 'color' => '#ef4444'],
        ];

        $stageModels = [];
        foreach ($stages as $stage) {
            $stageModels[] = CrmStage::firstOrCreate(
                ['crm_funnel_id' => $funnel->id, 'name' => $stage['name']],
                ['order_index' => $stage['order_index'], 'color' => $stage['color']]
            );
        }

        // ─────────────── Sample Contacts ───────────────
        $contacts = [
            ['name' => 'Carlos Mendes',    'phone' => '11991234567', 'email' => 'carlos@email.com',   'status' => 'lead'],
            ['name' => 'Fernanda Lima',    'phone' => '11982345678', 'email' => 'fernanda@email.com', 'status' => 'client'],
            ['name' => 'Roberto Souza',    'phone' => '11973456789', 'email' => 'roberto@email.com',  'status' => 'lead'],
            ['name' => 'Ana Paula Costa',  'phone' => '11964567890', 'email' => 'ana@email.com',      'status' => 'lead'],
            ['name' => 'Marcos Oliveira',  'phone' => '11955678901', 'email' => 'marcos@email.com',   'status' => 'client'],
        ];

        $contactModels = [];
        foreach ($contacts as $c) {
            $contactModels[] = Contact::firstOrCreate(['phone' => $c['phone']], $c);
        }

        // ─────────────── Sample Deals ───────────────
        $deals = [
            ['stage' => 0, 'contact' => 0, 'title' => 'Carlos - Interesse Kicks', 'vehicle_model' => 'Nissan Kicks', 'vehicle_year' => '2024', 'value' => 120000],
            ['stage' => 0, 'contact' => 2, 'title' => 'Roberto - Seminovo HRV',   'vehicle_model' => 'Honda HR-V',   'vehicle_year' => '2022', 'value' => 95000],
            ['stage' => 1, 'contact' => 1, 'title' => 'Fernanda - Novo Corolla',  'vehicle_model' => 'Toyota Corolla','vehicle_year' => '2024', 'value' => 160000],
            ['stage' => 1, 'contact' => 3, 'title' => 'Ana - Argo Trofeo',        'vehicle_model' => 'Fiat Argo',    'vehicle_year' => '2023', 'value' => 78000],
            ['stage' => 2, 'contact' => 4, 'title' => 'Marcos - Onix Plus',       'vehicle_model' => 'Chevrolet Onix','vehicle_year' => '2024', 'value' => 88000],
            ['stage' => 3, 'contact' => 1, 'title' => 'Fernanda - Civic vendido', 'vehicle_model' => 'Honda Civic',  'vehicle_year' => '2023', 'value' => 185000],
        ];

        foreach ($deals as $d) {
            CrmDeal::firstOrCreate(
                ['title' => $d['title']],
                [
                    'crm_stage_id'  => $stageModels[$d['stage']]->id,
                    'contact_id'    => $contactModels[$d['contact']]->id,
                    'vehicle_model' => $d['vehicle_model'],
                    'vehicle_year'  => $d['vehicle_year'],
                    'value'         => $d['value'],
                ]
            );
        }

        // ─────────────── Sample Conversations (Inbox) ───────────────
        foreach ($contactModels as $contact) {
            Conversation::firstOrCreate(
                ['contact_id' => $contact->id],
                [
                    'channel'         => 'whatsapp',
                    'status'          => 'open',
                    'last_message_at' => now()->subMinutes(rand(1, 120)),
                ]
            );
        }
    }
}
