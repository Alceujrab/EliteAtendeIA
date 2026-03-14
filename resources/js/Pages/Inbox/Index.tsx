import KinboxLayout from '@/Layouts/KinboxLayout';
import { Head, usePage } from '@inertiajs/react';
import ConversationList from '@/Components/Inbox/ConversationList';
import ChatArea from '@/Components/Inbox/ChatArea';
import ContactPanel from '@/Components/Inbox/ContactPanel';
import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import axios from 'axios';

export default function InboxIndex() {
    const { conversations, agents } = usePage<any>().props;
    const items = conversations?.data || conversations || [];
    const [activeId, setActiveId] = useState<number | null>(items[0]?.id ?? null);
    const [showPanel, setShowPanel] = useState(true);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [newName, setNewName] = useState('');

    const active = items.find((c: any) => c.id === activeId) || items[0] || null;

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (!activeId) return;

        axios.get(`/api/inbox/conversations/${activeId}`)
            .then(res => {
                setChatMessages(res.data.messages || []);
            })
            .catch(() => {
                setChatMessages([]);
            });
    }, [activeId]);

    const handleSelectConversation = (id: number) => {
        setActiveId(id);
    };

    const handleMessagesUpdate = useCallback((msgs: any[]) => {
        setChatMessages(msgs);
    }, []);

    const handleNewConversation = async () => {
        if (!newPhone.trim()) return;
        try {
            const res = await axios.post('/api/inbox/conversations', {
                phone: newPhone,
                name: newName || 'Novo Contato',
                channel: 'whatsapp',
            });
            if (res.data.success) {
                setShowNewConversation(false);
                setNewPhone('');
                setNewName('');
                // Reload page to get fresh data
                window.location.reload();
            }
        } catch (err) {
            alert('Erro ao criar conversa.');
        }
    };

    return (
        <KinboxLayout
            sidebar={
                <div className="flex flex-col h-full">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => setShowNewConversation(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Nova Conversa
                        </button>
                    </div>
                    <ConversationList
                        conversations={items}
                        activeId={activeId}
                        onSelect={handleSelectConversation}
                    />
                </div>
            }
        >
            <Head title="Caixa de Entrada" />

            <div className="flex h-full w-full">
                {active ? (
                    <>
                        <ChatArea
                            conversation={active}
                            messages={chatMessages}
                            agents={agents || []}
                            onTogglePanel={() => setShowPanel(!showPanel)}
                            onMessagesUpdate={handleMessagesUpdate}
                        />
                        {showPanel && <ContactPanel contact={active.contact} />}
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center text-gray-400 gap-3">
                        <MessageSquare className="h-12 w-12 opacity-40" />
                        <p className="text-sm">Nenhuma conversa selecionada</p>
                    </div>
                )}
            </div>

            {/* New Conversation Modal */}
            {showNewConversation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNewConversation(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nova Conversa</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone *</label>
                                <input
                                    type="text"
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    placeholder="5511999999999"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Nome do contato"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowNewConversation(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={handleNewConversation} disabled={!newPhone.trim()} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </KinboxLayout>
    );
}
