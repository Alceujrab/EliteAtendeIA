import { Plus, Play, Pause, ChevronRight } from 'lucide-react';

const DUMMY_CAMPAIGNS = [
    { id: 1, name: 'Feirão de Seminovos', audience: 'Leads Antigos > 6 Meses', status: 'Ativa', sent: 1200, opens: 850, replies: 120, date: '2023-10-10' },
    { id: 2, name: 'Promoção Taxa Zero Corolla', audience: 'Tag: Corolla', status: 'Pausada', sent: 300, opens: 250, replies: 45, date: '2023-10-08' },
];

export default function Campaigns() {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Campanhas Ativas</h1>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
                    <Plus className="h-4 w-4" /> Nova Campanha
                </button>
            </div>
            
            <div className="p-6 overflow-auto">
                <div className="grid gap-6">
                    {DUMMY_CAMPAIGNS.map(campaign => (
                        <div key={campaign.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 transition-colors shadow-sm dark:bg-gray-800/30">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {campaign.name}
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            campaign.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {campaign.status}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Público Alvo: {campaign.audience} • Criada em {campaign.date}</p>
                                </div>
                                <div className="flex gap-2">
                                    {campaign.status === 'Ativa' ? (
                                        <button title="Pausar Campanha" aria-label="Pausar" className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                                            <Pause className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button title="Iniciar Campanha" aria-label="Iniciar" className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                            <Play className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button className="p-2 text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors flex items-center gap-1 text-xs font-semibold">
                                        Detalhes <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Funil visual da campanha */}
                            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                                <div>
                                    <p className="text-sm text-gray-500">Enviados</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.sent}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Entregues / Lidos</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {campaign.opens} <span className="text-sm font-medium text-gray-400 dark:text-gray-500">({Math.round((campaign.opens / campaign.sent) * 100)}%)</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Respostas</p>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {campaign.replies} <span className="text-sm font-medium text-gray-400 dark:text-gray-500">({Math.round((campaign.replies / campaign.opens) * 100)}%)</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
