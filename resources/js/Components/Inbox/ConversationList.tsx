import { useState } from 'react';
import { Search, Filter, MoreHorizontal, MessageSquarePlus } from 'lucide-react';

interface ConversationListProps {
    conversations: any[];
    activeId: number | null;
    onSelect: (id: number) => void;
}

export default function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter((conv) => 
        conv.contact?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.channel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shrink-0">
            {/* Header da Lista */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fila Geral</h2>
                <div className="flex gap-2 text-gray-500">
                    <button className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" title="Nova Conversa">
                        <MessageSquarePlus className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" title="Filtros">
                        <Filter className="h-4 w-4" />
                    </button>
                    <DropdownAction />
                </div>
            </div>

            {/* Busca Local */}
            <div className="px-4 py-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar mensagens"
                        className="w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Lista Rolável */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conv) => {
                    const isActive = conv.id === activeId;
                    const contactName = conv.contact?.name || 'Desconhecido';
                    
                    return (
                        <div 
                            key={conv.id} 
                            onClick={() => onSelect(conv.id)}
                            className={`group relative cursor-pointer border-b border-gray-100 p-4 transition-colors dark:border-gray-800 ${
                                isActive 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-500"></div>
                            )}
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold dark:bg-indigo-900/50 dark:text-indigo-400">
                                        {contactName.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-semibold truncate w-36 ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {contactName}
                                        </h3>
                                        <div className="text-xs text-gray-400 capitalize">{conv.channel}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs text-gray-500">
                                        {new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    {conv.status === 'unread' && (
                                        <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                    )}
                                </div>
                            </div>
                            <p className={`text-sm mt-1 truncate ${conv.status === 'unread' ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                                {conv.status === 'open' ? 'Conversa em andamento...' : 'Aguardando atendimento...'}
                            </p>
                        </div>
                    );
                })}
                {filteredConversations.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Nenhuma conversa encontrada.
                    </div>
                )}
            </div>
        </div>
    );
}

function DropdownAction() {
    return (
        <button className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" title="Mais opções">
            <MoreHorizontal className="h-4 w-4" />
        </button>
    )
}
