import KinboxLayout from '@/Layouts/KinboxLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ChatbotBuilder from '@/Components/Settings/ChatbotBuilder';
import { MessageCircle, Shield, Sliders, Smartphone } from 'lucide-react';

export default function SettingsIndex() {
    const [view, setView] = useState<'geral' | 'permissoes' | 'chatbot' | 'canais'>('chatbot');
    const user = usePage().props.auth.user;

    const navItems = [
        { id: 'geral', label: 'Geral', icon: <Sliders className="h-4 w-4" /> },
        { id: 'permissoes', label: 'Membros e Permissões', icon: <Shield className="h-4 w-4" /> },
        { id: 'chatbot', label: 'Bot & Automações', icon: <MessageCircle className="h-4 w-4" /> },
        { id: 'canais', label: 'Canais (WhatsApp)', icon: <Smartphone className="h-4 w-4" /> },
    ];

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
            <Head title="Configurações Locais" />
            
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

            {view === 'geral' && (
                <div className="p-8 h-full w-full max-w-4xl mx-auto overflow-y-auto w-full">
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

            {view === 'canais' && (
                <div className="p-8 h-full w-full max-w-4xl mx-auto overflow-y-auto w-full">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-4">Canais Conectados</h1>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/10 rounded-xl p-6 relative">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                <span className="text-xs font-semibold text-green-700 dark:text-green-400">Autenticado</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">WhatsApp Oficial</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Evolution API - Instância 1</p>
                            <button className="text-sm font-medium text-green-700 bg-white border border-green-200 shadow-sm px-4 py-2 rounded-md hover:bg-green-50 transition-colors">
                                Desconectar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'permissoes' && (
                <div className="p-8 h-full w-full max-w-4xl mx-auto overflow-y-auto w-full">
                    <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Gerenciamento RBAC</h1>
                    <p className="text-gray-500">Tela de configuração de permissões avançadas...</p>
                </div>
            )}
        </KinboxLayout>
    );
}
