import { Phone, MessageSquare, Tag, ChevronDown, CalendarClock } from 'lucide-react';

interface ContactPanelProps {
    isOpen: boolean;
}

export default function ContactPanel({ isOpen }: ContactPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-y-auto shrink-0 transition-all">
            {/* Header Contact */}
            <div className="flex flex-col items-center p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 ring-4 ring-white dark:bg-indigo-900/50 dark:text-indigo-400 dark:ring-gray-900">
                    JS
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">João Silva</h2>
                <p className="text-sm text-gray-500 mb-4">+55 11 99999-0000</p>

                <div className="flex w-full gap-2">
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-md bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                        Msg
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900 transition-colors">
                        <Phone className="h-4 w-4" />
                        Ligar
                    </button>
                </div>
            </div>

            {/* Accordions */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {/* Contato Info Tab */}
                <div className="p-4">
                    <button className="flex w-full items-center justify-between font-semibold text-gray-700 dark:text-gray-300">
                        <span>Detalhes do Contato</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    <div className="mt-4 space-y-3">
                        <div>
                            <span className="block text-xs text-gray-500">E-mail</span>
                            <span className="text-sm font-medium dark:text-gray-200">joao.silva@exemplo.com.br</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">Tags</span>
                            <div className="flex flex-wrap gap-1">
                                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Tag className="h-3 w-3" /> Financiamento
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                    <Tag className="h-3 w-3" /> Corolla
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Veículo de Interesse</span>
                            <span className="text-sm font-medium dark:text-gray-200">Toyota Corolla XEI 2022</span>
                        </div>
                    </div>
                </div>

                {/* Negociações Tab */}
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <button className="flex w-full items-center justify-between font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <span>Negociações CRM</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {/* CRM Card Micro */}
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate pr-2">Corolla 2022 João</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">AQUECIDO</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">Valor: R$ 135.000</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 dark:bg-gray-700">
                            <div className="bg-indigo-500 h-1.5 rounded-full w-[40%]"></div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 text-right">Etapa: Qualificação</div>
                    </div>
                </div>

                {/* Tarefas Tab */}
                <div className="p-4">
                    <button className="flex w-full items-center justify-between font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <span>Tarefas</span>
                        <div className="h-5 w-5 bg-gray-100 rounded-full flex justify-center items-center text-xs dark:bg-gray-800">1</div>
                    </button>
                    
                    <div className="flex items-start gap-3 mt-2">
                        <input type="checkbox" title="Marcar tarefa como concluída" aria-label="Concluir Tarefa" className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Ligar p/ confirmar simulação BV</p>
                            <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                                <CalendarClock className="h-3 w-3" /> Hoje às 14:00
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notas Tab */}
                <div className="p-4 bg-yellow-50/30 dark:bg-yellow-900/10">
                    <button className="flex w-full items-center justify-between font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <span>Bloco de Notas Contínuo</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    <textarea 
                        className="w-full resize-none rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-900 placeholder-yellow-600/50 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-100 min-h-[100px]"
                        placeholder="Adicione observações permanentes aqui..."
                    ></textarea>
                </div>
            </div>
        </div>
    );
}
