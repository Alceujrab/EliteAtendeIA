import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, UserPlus, FolderOpen, MoreHorizontal, Info, Mic, List, Zap, Smile, Paperclip, Send, RefreshCw } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface ChatAreaProps {
    conversation: any;
    messages: any[];
    agents: any[];
    onTogglePanel: () => void;
    onMessagesUpdate: (msgs: any[]) => void;
}

export default function ChatArea({ conversation, messages, agents, onTogglePanel, onMessagesUpdate }: ChatAreaProps) {
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [isNote, setIsNote] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const contact = conversation.contact || { name: 'Desconhecido' };
    const avatarInitials = contact.name.substring(0, 2).toUpperCase();

    const commonEmojis = ['😊', '👍', '❤️', '😂', '🙏', '🔥', '✅', '🎉', '💪', '👏', '😍', '🤝', '⭐', '💰', '🚗'];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, conversation.id]);

    const handleSend = useCallback(async () => {
        if (!messageText.trim()) return;
        setSending(true);

        try {
            const response = await axios.post(`/api/inbox/conversations/${conversation.id}/messages`, {
                body: messageText,
                type: 'text',
                is_internal_note: isNote,
            });

            if (response.data.success) {
                onMessagesUpdate([...messages, response.data.message]);
                setMessageText('');
                setIsNote(false);
            }
        } catch (err) {
            console.error('Erro ao enviar:', err);
            alert('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setSending(false);
        }
    }, [messageText, conversation.id, isNote, messages, onMessagesUpdate]);

    const handleResolve = () => {
        if (conversation.status === 'resolved') {
            router.post(`/api/inbox/conversations/${conversation.id}/reopen`, {}, { preserveScroll: true });
        } else {
            router.post(`/api/inbox/conversations/${conversation.id}/resolve`, {}, { preserveScroll: true });
        }
    };

    const handleAssign = (userId: number) => {
        router.post(`/api/inbox/conversations/${conversation.id}/assign`, {
            assigned_to: userId
        }, { preserveScroll: true });
        setShowAssignMenu(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await axios.post('/api/inbox/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (uploadRes.data.success) {
                // Send as media message
                const msgRes = await axios.post(`/api/inbox/conversations/${conversation.id}/messages`, {
                    body: file.name,
                    type: file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : 'document',
                    media_url: uploadRes.data.url,
                    media_type: file.type,
                });

                if (msgRes.data.success) {
                    onMessagesUpdate([...messages, msgRes.data.message]);
                }
            }
        } catch (err) {
            alert('Erro ao enviar arquivo.');
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const insertEmoji = (emoji: string) => {
        setMessageText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const isResolved = conversation.status === 'resolved';

    return (
        <div className="flex w-full flex-1 flex-col bg-slate-50 dark:bg-gray-800 shrink-0 min-w-0">
            {/* Chat Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                        {avatarInitials}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h2>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <span className={`flex h-2 w-2 rounded-full ${isResolved ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                            {conversation.channel === 'whatsapp' ? 'WhatsApp' : conversation.channel === 'instagram' ? 'Instagram' : 'Chat'}
                            {isResolved ? ' (Resolvida)' : ' (Ativa)'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleResolve}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            isResolved 
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                    >
                        {isResolved ? <RefreshCw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        {isResolved ? 'Reabrir' : 'Resolver'}
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowAssignMenu(!showAssignMenu)}
                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" 
                            title="Atribuir"
                        >
                            <UserPlus className="h-5 w-5" />
                        </button>
                        {showAssignMenu && (
                            <div className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase">Atribuir para</div>
                                {agents.map((agent: any) => (
                                    <button
                                        key={agent.id}
                                        onClick={() => handleAssign(agent.id)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                            conversation.assigned_to === agent.id ? 'text-indigo-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {agent.name} {conversation.assigned_to === agent.id && '✓'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex justify-center py-12 text-gray-400 text-sm">
                        Nenhuma mensagem ainda. Inicie a conversa!
                    </div>
                )}

                {messages.map((msg: any) => {
                    const isAgent = !!msg.user_id;
                    const isInternalNote = msg.is_internal_note;

                    if (isInternalNote) {
                        return (
                            <div key={msg.id} className="flex justify-center max-w-full">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-3 flex w-full max-w-2xl rounded-xl shadow-sm gap-3">
                                    <Zap className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-xs text-yellow-800 dark:text-yellow-500">
                                            Nota Interna — {msg.user?.name || 'Sistema'}
                                        </span>
                                        <p className="text-sm text-yellow-900 dark:text-yellow-600">{msg.body}</p>
                                        <span className="text-[10px] text-yellow-600 mt-1">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (isAgent) {
                        return (
                            <div key={msg.id} className="flex gap-3 justify-end max-w-2xl ml-auto">
                                <div>
                                    <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                                        {msg.media_url && msg.type === 'image' && (
                                            <img src={msg.media_url} alt="Anexo" className="rounded-lg mb-2 max-w-xs" />
                                        )}
                                        {msg.media_url && msg.type === 'document' && (
                                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">
                                                <Paperclip className="h-3 w-3" /> {msg.body || 'Arquivo'}
                                            </a>
                                        )}
                                        {(!msg.media_url || msg.type === 'text') && msg.body}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        <Check className="h-3 w-3 text-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Contact message
                    return (
                        <div key={msg.id} className="flex gap-3 justify-start max-w-2xl">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shrink-0">
                                {avatarInitials}
                            </div>
                            <div>
                                <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200">
                                    {msg.media_url && msg.type === 'image' && (
                                        <img src={msg.media_url} alt="Anexo" className="rounded-lg mb-2 max-w-xs" />
                                    )}
                                    {msg.body}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 ml-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Editor */}
            <div className="shrink-0 p-4 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                {/* Note Mode Indicator */}
                {isNote && (
                    <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                        <Zap className="h-3.5 w-3.5" />
                        <span className="font-medium">Modo Nota Interna</span>
                        <button onClick={() => setIsNote(false)} className="ml-auto text-yellow-600 hover:text-yellow-800 font-medium">Cancelar</button>
                    </div>
                )}

                <div className={`flex flex-col rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-800 transition-colors focus-within:ring-1 min-h-[120px] ${
                    isNote 
                        ? 'border-yellow-300 focus-within:border-yellow-500 focus-within:ring-yellow-500' 
                        : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-indigo-500'
                }`}>
                    <textarea 
                        className="w-full resize-none border-0 bg-transparent p-3 text-sm focus:ring-0 dark:text-white"
                        placeholder={isNote ? 'Escreva uma nota interna (não será enviada ao contato)...' : "Shift + Enter para nova linha. '/' para frase rápida."}
                        rows={3}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    ></textarea>
                    
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2 rounded-b-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-1">
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Áudio (em breve)">
                                <Mic className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Respostas Rápidas (/)">
                                <List className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => setIsNote(!isNote)}
                                className={`rounded p-1.5 transition-colors ${isNote ? 'text-yellow-600 bg-yellow-100' : 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'}`} 
                                title="Adicionar Nota Interna"
                            >
                                <div className={`h-4 w-4 rounded-full ${isNote ? 'bg-yellow-500' : 'bg-yellow-400'}`}></div>
                            </button>
                            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" title="Automações Mágicas">
                                <Zap className="h-4 w-4" />
                            </button>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" 
                                    title="Emojis"
                                >
                                    <Smile className="h-4 w-4" />
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute bottom-10 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1 w-52">
                                        {commonEmojis.map(emoji => (
                                            <button 
                                                key={emoji} 
                                                onClick={() => insertEmoji(emoji)}
                                                className="text-xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" 
                                title="Anexar Arquivo"
                            >
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <input 
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                            />
                        </div>
                        
                        <button 
                            onClick={handleSend}
                            disabled={!messageText.trim() || sending}
                            title="Enviar Mensagem" 
                            className={`fixed-send-button flex items-center justify-center rounded-lg p-2 text-white transition-colors shadow-sm disabled:opacity-50 h-8 w-8 ${
                                isNote ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
