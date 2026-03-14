import { useState } from 'react';
import { Check, UserPlus, FolderOpen, MoreHorizontal, Info, Mic, List, Zap, Smile, Paperclip, Send } from 'lucide-react';

interface ChatAreaProps {
    onTogglePanel: () => void;
}

export default function ChatArea({ onTogglePanel }: ChatAreaProps) {
    const [message, setMessage] = useState('');

    return (
        <div className="flex w-full flex-1 flex-col bg-slate-50 dark:bg-gray-800 shrink-0 min-w-0">
            {/* Chat Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                        JS
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">João Silva</h2>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            WhatsApp (Online)
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                        <Check className="h-4 w-4" />
                        Resolver
                    </button>
                    <button className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Atribuir">
                        <UserPlus className="h-5 w-5" />
                    </button>
                    <button className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Mover para pasta">
                        <FolderOpen className="h-5 w-5" />
                    </button>
                    <button className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Mais opções">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <button 
                        onClick={onTogglePanel}
                        className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/50" title="Info do Contato">
                        <Info className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Chat Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <div className="flex justify-center">
                    <span className="px-3 py-1 bg-white dark:bg-gray-900 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100 dark:border-gray-800">
                        Hoje
                    </span>
                </div>
                
                {/* User Message */}
                <div className="flex gap-3 justify-start max-w-2xl">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shrink-0">
                        JS
                    </div>
                    <div>
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200">
                            Olá, vi o anúncio do Corolla 2022. Ainda está disponível? Gostaria de saber as condições de financiamento.
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-1">10:45</div>
                    </div>
                </div>

                {/* Internal Note */}
                <div className="flex justify-center max-w-full">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-3 flex w-full max-w-2xl rounded-xl shadow-sm gap-3">
                        <Zap className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-xs text-yellow-800 dark:text-yellow-500">Nota Interna - Vendedor Marcos</span>
                            <p className="text-sm text-yellow-900 dark:text-yellow-600">
                                Cliente já tem aprovação prévia com o banco BV. Tentar empurrar o seguro junto.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Agent Message */}
                <div className="flex gap-3 justify-end max-w-2xl ml-auto">
                    <div>
                        <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                            Olá João! Sim, está disponível. A entrada mínima para esse modelo é de 30% com taxas a partir de 1.49% a.m. Você tem algum veículo para dar na troca?
                        </div>
                        <div className="text-xs text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
                            10:52 <Check className="h-3 w-3 text-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Editor */}
            <div className="shrink-0 p-4 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 min-h-[120px]">
                    <textarea 
                        className="w-full resize-none border-0 bg-transparent p-3 text-sm focus:ring-0 dark:text-white"
                        placeholder="Shift + Enter para nova linha. '/' para frase rápida."
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                    
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2 rounded-b-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-1">
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Áudio">
                                <Mic className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Respostas Rápidas (/)">
                                <List className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1.5 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30" title="Adicionar Nota Interna">
                                <span className="sr-only">Nota Interna</span>
                                <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
                            </button>
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Automações Mágicas">
                                <Zap className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Emojis">
                                <Smile className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Anexar Arquivo">
                                <Paperclip className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <button title="Enviar Mensagem" aria-label="Enviar Mensagem" className="fixed-send-button flex items-center justify-center rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 h-8 w-8">
                            <Send className="h-4 w-4 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
