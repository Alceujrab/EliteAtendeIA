import { useState } from 'react';
import KinboxLayout from '@/Layouts/KinboxLayout';
import { Head } from '@inertiajs/react';
import ConversationList from '@/Components/Inbox/ConversationList';
import ChatArea from '@/Components/Inbox/ChatArea';
import ContactPanel from '@/Components/Inbox/ContactPanel';
import { Inbox, User, Clock, Archive, Plus } from 'lucide-react';

export default function InboxIndex() {
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
        <KinboxLayout 
            sidebar={
                <div className="flex h-full flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <button className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
                            <Plus className="h-4 w-4" />
                            Add Filtro
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-2">
                        <ul className="space-y-1 px-2">
                            <li>
                                <button className="flex w-full items-center justify-between rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                                    <div className="flex items-center gap-2">
                                        <Inbox className="h-4 w-4" /> Entrada
                                    </div>
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs dark:bg-indigo-900/50">4</span>
                                </button>
                            </li>
                            <li>
                                <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" /> Meus
                                    </div>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">12</span>
                                </button>
                            </li>
                            <li>
                                <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Seguindo
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Archive className="h-4 w-4" /> Arquivados
                                    </div>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            }
        >
            <Head title="Caixa de Entrada - Omnichannel" />
            
            <div className="flex h-full w-full overflow-hidden">
                <ConversationList />
                <ChatArea onTogglePanel={() => setIsPanelOpen(!isPanelOpen)} />
                <ContactPanel isOpen={isPanelOpen} />
            </div>
        </KinboxLayout>
    );
}
