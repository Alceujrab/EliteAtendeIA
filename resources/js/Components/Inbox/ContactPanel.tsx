import { Phone, MessageSquare, Tag, ChevronDown, CalendarClock } from 'lucide-react';

interface ContactPanelProps {
    isOpen: boolean;
    contact: any;
}

export default function ContactPanel({ isOpen, contact }: ContactPanelProps) {
    if (!isOpen || !contact) return null;

    const contactName = contact.name || 'Desconhecido';
    const avatarInitials = contactName.substring(0, 2).toUpperCase();

    return (
        <div className="w-80 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-y-auto shrink-0 transition-all">
            {/* Header Contact */}
            <div className="flex flex-col items-center p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 ring-4 ring-white dark:bg-indigo-900/50 dark:text-indigo-400 dark:ring-gray-900">
                    {avatarInitials}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{contactName}</h2>
                <p className="text-sm text-gray-500 mb-4">{contact.phone || 'Sem telefone'}</p>

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
                            <span className="text-sm font-medium dark:text-gray-200">{contact.email || 'Não informado'}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">Tags</span>
                            <div className="flex flex-wrap gap-1">
                                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Tag className="h-3 w-3" /> Lead
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Negociações Tab */}
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <button className="flex w-full items-center justify-between font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <span>Negociações CRM</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    <div className="text-sm text-gray-500 text-center py-2">
                        Verifique o CRM para negociações ativas
                    </div>
                </div>

                {/* Tarefas Tab */}
                <div className="p-4">
                    <button className="flex w-full items-center justify-between font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <span>Tarefas</span>
                        <div className="h-5 w-5 bg-gray-100 rounded-full flex justify-center items-center text-xs dark:bg-gray-800">0</div>
                    </button>
                    <div className="text-sm text-gray-500 text-center py-2">
                        Nenhuma tarefa pendente
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
