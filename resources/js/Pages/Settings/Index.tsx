import KinboxLayout from '@/Layouts/KinboxLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ChatbotBuilder from '@/Components/Settings/ChatbotBuilder';
import { MessageCircle, Shield, Sliders, Smartphone, Plus, Trash2, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

interface ChannelForm {
    name: string;
    type: string;
    settings: Record<string, string>;
}

const CHANNEL_TYPES = [
    { value: 'whatsapp_evolution', label: 'WhatsApp (Evolution API)', color: 'green' },
    { value: 'whatsapp_official', label: 'WhatsApp (Cloud API Oficial)', color: 'green' },
    { value: 'instagram', label: 'Instagram', color: 'pink' },
    { value: 'facebook', label: 'Facebook Messenger', color: 'blue' },
];

const CHANNEL_FIELDS: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
    whatsapp_evolution: [
        { key: 'api_url', label: 'URL da API Evolution', placeholder: 'https://api.evolution.com' },
        { key: 'api_key', label: 'API Key', placeholder: 'Sua chave de API', type: 'password' },
        { key: 'instance_name', label: 'Nome da Instância', placeholder: 'minha-instancia' },
    ],
    whatsapp_official: [
        { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '1234567890' },
        { key: 'access_token', label: 'Access Token', placeholder: 'Token permanente', type: 'password' },
        { key: 'waba_id', label: 'WABA ID', placeholder: 'ID da conta WhatsApp Business' },
    ],
    instagram: [
        { key: 'page_id', label: 'Page ID', placeholder: 'ID da página do Instagram' },
        { key: 'page_access_token', label: 'Page Access Token', placeholder: 'Token de acesso da página', type: 'password' },
    ],
    facebook: [
        { key: 'page_id', label: 'Page ID', placeholder: 'ID da página do Facebook' },
        { key: 'page_access_token', label: 'Page Access Token', placeholder: 'Token de acesso da página', type: 'password' },
    ],
};

export default function SettingsIndex() {
    const { channels: initialChannels } = usePage<any>().props;
    const [view, setView] = useState<'geral' | 'permissoes' | 'chatbot' | 'canais'>('canais');
    const [channels, setChannels] = useState<any[]>(initialChannels || []);
    const [showAddChannel, setShowAddChannel] = useState(false);
    const [testing, setTesting] = useState<number | null>(null);
    const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string } | null>(null);
    const [form, setForm] = useState<ChannelForm>({ name: '', type: 'whatsapp_evolution', settings: {} });
    const [saving, setSaving] = useState(false);

    const navItems = [
        { id: 'canais', label: 'Canais (Integrações)', icon: <Smartphone className="h-4 w-4" /> },
        { id: 'chatbot', label: 'Bot & Automações', icon: <MessageCircle className="h-4 w-4" /> },
        { id: 'geral', label: 'Geral', icon: <Sliders className="h-4 w-4" /> },
        { id: 'permissoes', label: 'Membros e Permissões', icon: <Shield className="h-4 w-4" /> },
    ];

    const handleSaveChannel = async () => {
        if (!form.name.trim()) return alert('Preencha o nome do canal.');
        setSaving(true);

        try {
            const res = await axios.post('/api/settings/channels', form);
            if (res.data.success) {
                setChannels([res.data.channel, ...channels]);
                setShowAddChannel(false);
                setForm({ name: '', type: 'whatsapp_evolution', settings: {} });
            }
        } catch (err) {
            alert('Erro ao salvar canal.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteChannel = async (channelId: number) => {
        if (!confirm('Tem certeza que deseja remover este canal?')) return;

        try {
            await axios.delete(`/api/settings/channels/${channelId}`);
            setChannels(channels.filter((c: any) => c.id !== channelId));
        } catch (err) {
            alert('Erro ao remover canal.');
        }
    };

    const handleTestChannel = async (channelId: number) => {
        setTesting(channelId);
        setTestResult(null);

        try {
            const res = await axios.post(`/api/settings/channels/${channelId}/test`);
            setTestResult({
                id: channelId,
                success: res.data.success && res.data.connected,
                message: res.data.connected ? `Conectado${res.data.page_name ? ` — ${res.data.page_name}` : ''}` : (res.data.error || res.data.state || 'Desconectado'),
            });

            if (res.data.connected) {
                setChannels(channels.map((c: any) => c.id === channelId ? { ...c, status: 'connected' } : c));
            }
        } catch (err: any) {
            setTestResult({ id: channelId, success: false, message: err.response?.data?.error || 'Erro de conexão.' });
        } finally {
            setTesting(null);
        }
    };

    const getChannelTypeLabel = (type: string) => CHANNEL_TYPES.find(t => t.value === type)?.label || type;
    const getChannelColor = (type: string) => {
        const colors: Record<string, string> = {
            whatsapp_evolution: 'green', whatsapp_official: 'green',
            instagram: 'pink', facebook: 'blue'
        };
        return colors[type] || 'gray';
    };

    return (
        <KinboxLayout
            sidebar={
                <div className="p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Configurações</h2>
                    <ul className="space-y-1">
                        {navItems.map(item => (
                            <li key={item.id}>
                                <button 
                                    onClick={() => setView(item.id as any)} 
                                    className={`flex items-center gap-2 w-full text-left text-sm font-medium p-2.5 rounded-md transition-colors ${
                                        view === item.id 
                                            ? 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/40' 
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            }
        >
            <Head title="Configurações" />
            
            {view === 'chatbot' && (
                <div className="h-full w-full flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Construtor Visual de Chatbot (Fluxos)</h1>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <ChatbotBuilder />
                    </div>
                </div>
            )}

            {view === 'canais' && (
                <div className="p-8 h-full w-full max-w-4xl mx-auto overflow-y-auto">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Canais Conectados</h1>
                        <button
                            onClick={() => setShowAddChannel(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Adicionar Canal
                        </button>
                    </div>

                    {/* Channel List */}
                    {channels.length === 0 && !showAddChannel && (
                        <div className="text-center py-16 text-gray-400">
                            <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Nenhum canal configurado.</p>
                            <button onClick={() => setShowAddChannel(true)} className="mt-3 text-sm text-indigo-600 font-medium hover:underline">
                                Adicionar primeiro canal
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {channels.map((ch: any) => {
                            const color = getChannelColor(ch.type);
                            const isConnected = ch.status === 'connected';
                            return (
                                <div key={ch.id} className={`border rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm border-gray-200 dark:border-gray-700`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ch.name}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{getChannelTypeLabel(ch.type)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                isConnected 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                                {isConnected ? 'Conectado' : 'Desconectado'}
                                            </span>
                                        </div>
                                    </div>

                                    {testResult !== null && testResult.id === ch.id && (
                                        <div className={`mt-3 flex items-center gap-2 text-sm p-2 rounded-lg ${
                                            testResult.success 
                                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            {testResult.message}
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleTestChannel(ch.id)}
                                            disabled={testing === ch.id}
                                            className="text-sm font-medium bg-white border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-300"
                                        >
                                            {testing === ch.id ? 'Testando...' : 'Testar Conexão'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChannel(ch.id)}
                                            className="text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Channel Form */}
                    {showAddChannel && (
                        <div className="mt-6 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Novo Canal</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Canal *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: WhatsApp Principal"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Canal *</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value, settings: {} })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                                    >
                                        {CHANNEL_TYPES.map(ct => (
                                            <option key={ct.value} value={ct.value}>{ct.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dynamic Fields */}
                                {CHANNEL_FIELDS[form.type]?.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                        <input
                                            type={field.type || 'text'}
                                            value={form.settings[field.key] || ''}
                                            onChange={e => setForm({ ...form, settings: { ...form.settings, [field.key]: e.target.value } })}
                                            placeholder={field.placeholder}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button onClick={() => setShowAddChannel(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveChannel} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                                    {saving ? 'Salvando...' : 'Salvar Canal'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'geral' && (
                <div className="p-8 h-full w-full max-w-4xl mx-auto overflow-y-auto">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-4">Configurações Gerais</h1>
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perfil da Organização</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                                    <input type="text" title="Nome da Empresa" aria-label="Nome da Empresa" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" defaultValue="Elite Veículos" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuso Horário</label>
                                    <select title="Fuso Horário" aria-label="Fuso Horário" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                        <option>America/Sao_Paulo (GMT-3)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'permissoes' && (
                <div className="p-8 h-full w-full max-w-4xl mx-auto overflow-y-auto">
                    <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Gerenciamento RBAC</h1>
                    <p className="text-gray-500">Tela de configuração de permissões avançadas...</p>
                </div>
            )}
        </KinboxLayout>
    );
}
