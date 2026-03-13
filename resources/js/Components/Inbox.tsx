import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { mockTickets } from '../data';
import { Ticket, Message, Channel, Vehicle, Customer } from '../types';
import { useVehicles } from '../VehicleContext';
import { 
  Search, Filter, Phone, Mail, Instagram, MessageCircle, 
  Send, MoreVertical, Paperclip, User, Clock, Tag, CheckCircle2, Circle, Car, Trello, ArrowRight, Bot, Database,
  Image as ImageIcon, Video, Mic, FileText, Zap, PanelRightClose, PanelRightOpen, Plus, Facebook, Forward,
  ChevronLeft, ChevronRight, X, Info, Share2
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import CustomerModal from './CustomerModal';

const ChannelIcon = ({ channel, className = "w-4 h-4" }: { channel: Channel, className?: string }) => {
  switch (channel) {
    case 'whatsapp': return <MessageCircle className={`${className} text-emerald-500`} />;
    case 'email': return <Mail className={`${className} text-blue-500`} />;
    case 'instagram': return <Instagram className={`${className} text-pink-500`} />;
    case 'facebook': return <Facebook className={`${className} text-blue-600`} />;
    case 'phone': return <Phone className={`${className} text-slate-500`} />;
  }
};

const StatusBadge = ({ status }: { status: Ticket['status'] }) => {
  switch (status) {
    case 'open':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Aberto</span>;
    case 'pending':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Pendente</span>;
    case 'closed':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">Fechado</span>;
  }
};

export default function Inbox({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { appUser } = useAuth();
  const { vehicles } = useVehicles();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInbox, setSelectedInbox] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [inboxes, setInboxes] = useState<any[]>([]);

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForModal, setCustomerForModal] = useState<Customer | null>(null);

  // Details Modal State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedVehicle?.images && selectedVehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedVehicle.images!.length);
    }
  };

  const prevImage = () => {
    if (selectedVehicle?.images && selectedVehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedVehicle.images!.length) % selectedVehicle.images!.length);
    }
  };

  // Fetch Inboxes
  useEffect(() => {
    axios.get('/api/inboxes')
      .then(res => setInboxes(res.data))
      .catch(err => console.error("Error fetching inboxes:", err));
  }, []);

  const cannedResponses = [
    "Olá! Como posso ajudar você hoje?",
    "Seu pedido já foi despachado e está a caminho.",
    "Por favor, aguarde um momento enquanto verifico.",
    "Obrigado pelo contato! Tenha um ótimo dia.",
    "Qual o modelo do veículo que você procura?"
  ];

  const handleAddTag = async (tag: string) => {
    if (!tag.trim() || !selectedTicketId) return;
    try {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      if (!ticket) return;
      
      const newTags = [...ticket.tags, tag.trim()];
      await axios.put(`/api/tickets/${selectedTicketId}`, { tags: newTags });
      
      setTickets(tickets.map(t => t.id === selectedTicketId ? { ...t, tags: newTags } : t));
      setIsAddingTag(false);
      setNewTag('');
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleTransfer = async () => {
    if (!selectedTicketId || !transferTarget) return;
    try {
      const isInbox = inboxes.some(i => i.id === transferTarget);
      const updates = {
        assignedTo: isInbox ? undefined : transferTarget,
        inbox: isInbox ? transferTarget : selectedTicket?.inbox
      };
      
      await axios.put(`/api/tickets/${selectedTicketId}`, updates);
      
      setTickets(tickets.map(t => t.id === selectedTicketId ? { ...t, ...updates } : t));
      setShowTransferModal(false);
      setTransferTarget('');
    } catch (error) {
      console.error("Error transferring ticket:", error);
    }
  };
  
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const accessibleInboxes = (inboxes || []).filter(inbox => 
    appUser?.role === 'admin' || 
    (inbox.access_type || inbox.accessType) === 'all' || 
    ((inbox.access_type || inbox.accessType) === 'specific' && (inbox.allowed_users || inbox.allowedUsers || []).includes(appUser?.id))
  ).map(inbox => inbox.id);

  const filteredTickets = (tickets || []).filter(t => {
    const matchesSearch = t.customerName?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
                          t.lastMessage?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
                          t.customerPhone?.includes(searchQuery || '');
    // Match inbox by ID or by name (webhook saves instance name, not ID)
    const ticketInbox = t.inbox || '';
    const matchesInbox = selectedInbox === 'all' || 
      ticketInbox === selectedInbox || 
      ticketInbox === String(selectedInbox) ||
      inboxes.some(i => (i.id === selectedInbox || String(i.id) === selectedInbox) && 
        (i.name?.toLowerCase() === ticketInbox.toLowerCase() || 
         i.settings?.evolutionInstance?.toLowerCase() === ticketInbox.toLowerCase()));
    const matchesChannel = channelFilter === 'all' || t.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesTag = tagFilter === 'all' || (t.tags && t.tags.includes(tagFilter));
    return matchesSearch && matchesInbox && matchesChannel && matchesStatus && matchesTag;
  });

  const unreadCounts = {
    all: (tickets || []).filter(t => t.status === 'open' && (accessibleInboxes.includes(t.inbox || '') || accessibleInboxes.length === 0)).length,
    ...(inboxes || []).reduce((acc, inbox) => {
      acc[inbox.id] = (tickets || []).filter(t => t.inbox === inbox.id && t.status === 'open').length;
      return acc;
    }, {} as Record<string, number>)
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Tickets periodically (polling instead of onSnapshot for now)
  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/tickets');
      setTickets(res.data);
      if (!selectedTicketId && res.data.length > 0) {
        setSelectedTicketId(res.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      // Fallback for UI visualization during migration phase if API fails setup
      if (tickets.length === 0 && loading) {
          setLoading(false);
          setTickets(mockTickets);
      }
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // Poll every 5 seconds since no sockets right now
    return () => clearInterval(interval);
  }, [selectedTicketId]);

  // Fetch Messages for Selected Ticket
  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages?ticket_id=${selectedTicketId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
        // Fallback to mock for testing UI
        const mockTicket = mockTickets.find(t => t.id === selectedTicketId);
        if(mockTicket && mockTicket.messages) {
           setMessages(mockTicket.messages);
        }
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedTicketId]);

  const sendExternalMessage = async (ticket: Ticket, text: string) => {
    if (!ticket.customerPhone) return;

    const inbox = inboxes.find(i => i.id === ticket.inbox);
    const settings = inbox?.settings || {};

    if (ticket.channel === 'instagram') {
      try {
        const response = await fetch('/api/send/instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId: ticket.customerPhone, text, settings })
        });
        const data = await response.json();
        if (!data.success) console.error("Failed to send Instagram message:", data.error);
      } catch (err) {
        console.error("Error calling Instagram API:", err);
      }
    } else if (ticket.channel === 'whatsapp') {
      try {
        const response = await fetch('/api/send/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId: ticket.customerPhone, text, settings })
        });
        const data = await response.json();
        if (!data.success) console.error("Failed to send WhatsApp message:", data.error);
      } catch (err) {
        console.error("Error calling WhatsApp API:", err);
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId || !selectedTicket) return;

    const text = replyText;
    setReplyText('');

    try {
      const timestamp = new Date().toISOString();
      const newMessage = {
        sender: 'agent',
        text: text,
        timestamp: timestamp,
        agentName: appUser?.name || 'Operador',
        ticket_id: selectedTicketId
      };

      await sendExternalMessage(selectedTicket, text);

      await axios.post('/api/messages', newMessage);
      
      // Update local state for immediate feedback
      setMessages(prev => [...prev, { id: Date.now().toString(), ...newMessage } as Message]);
      
      const updatedTicket = {
         ...selectedTicket,
         lastMessage: text,
         updatedAt: timestamp,
         lastMessageSender: 'agent' as const
      };
      // Update the ticket to trigger a refresh
      setTickets(tickets.map(t => t.id === selectedTicketId ? updatedTicket : t));
    } catch (error) {
       console.error("Error sending message:", error);
    }
  };

  const handleSendVehicle = async (vehicle: Vehicle) => {
    if (!selectedTicketId || !selectedTicket) return;

    try {
      const timestamp = new Date().toISOString();
      const text = `Veja este modelo: ${vehicle.brand} ${vehicle.model}`;
      const newMessage = {
        sender: 'agent',
        text: text,
        timestamp: timestamp,
        isVehicle: true,
        vehicleData: vehicle,
        agentName: appUser?.name || 'Operador',
        ticket_id: selectedTicketId
      };

      await sendExternalMessage(selectedTicket, text + `\nPreço: R$ ${vehicle.price.toLocaleString('pt-BR')}`);

      await axios.post('/api/messages', newMessage);
      
      // Update local state for immediate feedback
      setMessages(prev => [...prev, { id: Date.now().toString(), ...newMessage } as Message]);

      const updatedTicket = {
         ...selectedTicket,
         lastMessage: `[Catálogo] ${vehicle.brand} ${vehicle.model}`,
         updatedAt: timestamp,
         lastMessageSender: 'agent' as const
      };
      setTickets(tickets.map(t => t.id === selectedTicketId ? updatedTicket : t));
      setShowCatalog(false);
    } catch (error) {
       console.error("Error sending vehicle:", error);
    }
  };

  const sendExternalMedia = async (ticket: Ticket, mediaUrl: string, mediaType: 'image' | 'video' | 'audio' | 'document') => {
    if (!ticket.customerPhone) return;

    const inbox = inboxes.find(i => i.id === ticket.inbox);
    const settings = inbox?.settings || {};

    if (ticket.channel === 'instagram') {
      try {
        const response = await fetch('/api/send/instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: ticket.customerPhone,
            text: `[${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : mediaType === 'audio' ? 'Áudio' : 'Documento'} enviado]`,
            settings
          })
        });
        const data = await response.json();
        if (!data.success) console.error("Failed to send Instagram message:", data.error);
      } catch (err) {
        console.error("Error calling Instagram API:", err);
      }
    } else if (ticket.channel === 'whatsapp') {
      try {
        const response = await fetch('/api/send/whatsapp/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: ticket.customerPhone,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            settings
          })
        });
        const data = await response.json();
        if (!data.success) console.error("Failed to send WhatsApp media:", data.error);
      } catch (err) {
        console.error("Error calling WhatsApp API:", err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId || !selectedTicket) return;

    // Limit to 800KB for base64 to fit in Firestore 1MB limit - NOTE: Laravel can handle more, but keeping UI restriction for now
    if (file.size > 800000) {
      alert("O arquivo é muito grande. O limite é de 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      try {
        const timestamp = new Date().toISOString();
        const newMessage = {
          sender: 'agent',
          text: type === 'document' ? file.name : '',
          timestamp: timestamp,
          mediaUrl: base64Url,
          mediaType: type,
          agentName: appUser?.name || 'Operador',
          ticket_id: selectedTicketId
        };

        await sendExternalMedia(selectedTicket, base64Url, type);

        await axios.post('/api/messages', newMessage);
        
        // Update local state
        setMessages(prev => [...prev, { id: Date.now().toString(), ...newMessage } as Message]);

        const updatedTicket = {
            ...selectedTicket,
            lastMessage: `[${type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : type === 'audio' ? 'Áudio' : 'Documento'}]`,
            updatedAt: timestamp,
            lastMessageSender: 'agent' as const
        };
        setTickets(tickets.map(t => t.id === selectedTicketId ? updatedTicket : t));
      } catch (error) {
         console.error("Error uploading file:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // fallback if not ISO
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      
      {/* Left Panel: Ticket List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Caixa de Entrada</h2>
          </div>
          
          <div className="mb-4">
            <select 
              value={selectedInbox}
              onChange={(e) => setSelectedInbox(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              <option value="all">Todas as Caixas ({unreadCounts.all} aguardando)</option>
              {inboxes.filter(inbox => accessibleInboxes.includes(inbox.id)).map(inbox => (
                <option key={inbox.id} value={inbox.id}>
                  {inbox.name} ({unreadCounts[inbox.id] || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar conversas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button 
              onClick={() => setStatusFilter(prev => prev === 'all' ? 'open' : prev === 'open' ? 'pending' : prev === 'pending' ? 'closed' : 'all')}
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${statusFilter !== 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <Filter className="w-3 h-3" /> {statusFilter === 'all' ? 'Filtrar' : statusFilter === 'open' ? 'Abertos' : statusFilter === 'pending' ? 'Pendentes' : 'Fechados'}
            </button>
            <div className="flex gap-1 ml-auto">
              <button 
                onClick={() => setChannelFilter(prev => prev === 'whatsapp' ? 'all' : 'whatsapp')}
                className={`p-1 rounded transition-colors ${channelFilter === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-200 text-slate-500'}`}
                title="Filtrar WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setChannelFilter(prev => prev === 'instagram' ? 'all' : 'instagram')}
                className={`p-1 rounded transition-colors ${channelFilter === 'instagram' ? 'bg-pink-100 text-pink-600' : 'hover:bg-slate-200 text-slate-500'}`}
                title="Filtrar Instagram"
              >
                <Instagram className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setChannelFilter(prev => prev === 'facebook' ? 'all' : 'facebook')}
                className={`p-1 rounded transition-colors ${channelFilter === 'facebook' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500'}`}
                title="Filtrar Facebook Messenger"
              >
                <Facebook className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Nenhuma conversa encontrada.
            </div>
          ) :               filteredTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-100 hover:bg-blue-50 ${
                    selectedTicketId === ticket.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden">
                      {ticket.customerAvatar ? (
                        <img src={ticket.customerAvatar} alt={ticket.customerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-sm font-bold">
                          {(ticket.customerName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <ChannelIcon channel={ticket.channel} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 truncate">{ticket.customerName}</span>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">{formatDate(ticket.updatedAt || ticket.updated_at || '')}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {ticket.lastMessage?.startsWith('📷') || ticket.lastMessage?.startsWith('🎥') || ticket.lastMessage?.startsWith('🎵') 
                        ? ticket.lastMessage 
                        : ticket.lastMessage}
                    </p>
                  </div>
                  {/* Unread indicator */}
                  {ticket.status === 'open' && ticket.fromWebhook && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                  )}
                </div>               
            ))
          }
        </div>
      </div>

      {/* Middle Panel: Chat Area */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {/* Chat Header */}
          <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                {selectedTicket.customerAvatar ? (
                  <img src={selectedTicket.customerAvatar} alt={selectedTicket.customerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  {selectedTicket.customerName}
                  <ChannelIcon channel={selectedTicket.channel} />
                </h3>
                <p className="text-xs text-slate-500">{selectedTicket.id} • {selectedTicket.channel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setShowTransferModal(!showTransferModal)}
                className={`p-2 rounded-full transition-colors ${showTransferModal ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Encaminhar conversa"
              >
                <Forward className="w-5 h-5" />
              </button>
              
              {showTransferModal && (
                <div className="absolute top-full right-12 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-20">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Encaminhar para:</h4>
                  <div className="space-y-2">
                    <select 
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                    >
                      <option value="">Selecione um destino...</option>
                      <optgroup label="Caixas">
                        {inboxes.map(inbox => (
                          <option key={inbox.id} value={inbox.id}>{inbox.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Agentes">
                        <option value="agent_1">João Silva</option>
                        <option value="agent_2">Maria Oliveira</option>
                        <option value="agent_3">Carlos Santos</option>
                      </optgroup>
                    </select>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setShowTransferModal(false)}
                        className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleTransfer}
                        disabled={!transferTarget}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Transferir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`p-2 rounded-full transition-colors ${isRightSidebarOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Alternar painel lateral"
              >
                {isRightSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="space-y-6">
              {messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isBot = msg.sender === 'bot';
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isAgent || isBot ? 'items-end' : 'items-start'}`}>
                    {isAgent && msg.agentName && (
                      <span className="text-[10px] text-slate-400 mb-1 px-1">{msg.agentName}</span>
                    )}
                    {msg.isVehicle && msg.vehicleData ? (
                      <div className="max-w-[300px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-1">
                        <img src={msg.vehicleData.image} alt={msg.vehicleData.model} className="w-full h-32 object-cover" />
                        <div className="p-3">
                          <div className="text-xs text-blue-600 font-semibold uppercase">{msg.vehicleData.brand}</div>
                          <div className="font-bold text-slate-800">{msg.vehicleData.model}</div>
                          <div className="text-emerald-600 font-bold mt-1">R$ {msg.vehicleData.price.toLocaleString('pt-BR')}</div>
                          <button 
                            onClick={() => openDetails(msg.vehicleData!)}
                            className="w-full mt-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    ) : msg.mediaUrl ? (
                      <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                        isAgent ? 'bg-blue-600 text-white rounded-tr-sm' : 
                        isBot ? 'bg-slate-700 text-white rounded-tr-sm' :
                        'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="Media" className="max-w-full h-auto object-cover max-h-64" />}
                        {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls className="max-w-full h-auto max-h-64" />}
                        {msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls className="w-64 m-2" />}
                        {msg.mediaType === 'document' && (
                          <a href={msg.mediaUrl} download={msg.text || "document"} className="flex items-center gap-2 p-3 hover:bg-black/5 transition-colors">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                            <span className="text-sm font-medium underline truncate">{msg.text || "Documento"}</span>
                          </a>
                        )}
                        {msg.text && msg.mediaType !== 'document' && <p className="text-sm whitespace-pre-wrap p-3">{msg.text}</p>}
                      </div>
                    ) : (
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isAgent ? 'bg-blue-600 text-white rounded-tr-sm' : 
                        isBot ? 'bg-slate-700 text-white rounded-tr-sm' :
                        'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                      {isBot && <Bot className="w-3 h-3" />}
                      {formatDate(msg.timestamp || msg.created_at || '')}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 relative">
            {showCatalog && (
              <div className="absolute bottom-full mb-2 left-4 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-10">
                <div className="text-xs font-semibold text-slate-500 mb-2 px-2 flex items-center gap-2">
                  <Car className="w-4 h-4" /> Catálogo de Veículos (ERP)
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {vehicles.map(v => (
                    <div key={v.id} onClick={() => handleSendVehicle(v)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <img src={v.image} className="w-12 h-12 rounded object-cover" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{v.brand} {v.model}</div>
                        <div className="text-xs text-slate-500">R$ {v.price.toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showCanned && (
              <div className="absolute bottom-full mb-2 left-16 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-10">
                <div className="text-xs font-semibold text-slate-500 mb-2 px-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Respostas Rápidas
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {cannedResponses.map((msg, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { setReplyText(msg); setShowCanned(false); }} 
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg truncate text-slate-700 transition-colors"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showAttachments && (
              <div className="absolute bottom-full mb-2 left-4 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-10 flex gap-2">
                <label className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-600 flex flex-col items-center gap-2 transition-colors" title="Enviar Imagem">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><ImageIcon className="w-5 h-5" /></div>
                  <span className="text-xs font-medium">Imagem</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleFileUpload(e, 'image'); setShowAttachments(false); }} />
                </label>
                <label className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-600 flex flex-col items-center gap-2 transition-colors" title="Enviar Vídeo">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Video className="w-5 h-5" /></div>
                  <span className="text-xs font-medium">Vídeo</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => { handleFileUpload(e, 'video'); setShowAttachments(false); }} />
                </label>
                <label className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-600 flex flex-col items-center gap-2 transition-colors" title="Enviar Áudio">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Mic className="w-5 h-5" /></div>
                  <span className="text-xs font-medium">Áudio</span>
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => { handleFileUpload(e, 'audio'); setShowAttachments(false); }} />
                </label>
                <label className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-600 flex flex-col items-center gap-2 transition-colors" title="Enviar Documento">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                  <span className="text-xs font-medium">Doc</span>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={(e) => { handleFileUpload(e, 'document'); setShowAttachments(false); }} />
                </label>
              </div>
            )}

            <form onSubmit={handleSendReply} className="flex items-end gap-2">
              <button 
                type="button" 
                onClick={() => { setShowAttachments(!showAttachments); setShowCatalog(false); setShowCanned(false); }}
                className={`p-3 rounded-full transition-colors shrink-0 ${showAttachments ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Anexar Arquivo"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => { setShowCanned(!showCanned); setShowCatalog(false); setShowAttachments(false); }}
                className={`p-3 rounded-full transition-colors shrink-0 ${showCanned ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Respostas Rápidas"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => { setShowCatalog(!showCatalog); setShowAttachments(false); setShowCanned(false); }}
                className={`p-3 rounded-full transition-colors shrink-0 ${showCatalog ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Enviar Veículo do Catálogo"
              >
                <Car className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Responder via ${selectedTicket.channel}...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                />
              </div>
              
              {replyText.trim() ? (
                <button 
                  type="submit"
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <label className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors shrink-0 cursor-pointer" title="Enviar Áudio">
                  <Mic className="w-5 h-5" />
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} />
                </label>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center text-slate-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Selecione uma conversa para visualizar</p>
          </div>
        </div>
      )}

      {/* Right Panel: Customer Info & Actions */}
      {selectedTicket && isRightSidebarOpen && (
        <div className="w-72 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden shadow-sm border border-slate-200">
              {selectedTicket.customerAvatar ? (
                <img src={selectedTicket.customerAvatar} alt={selectedTicket.customerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 text-xl font-bold">
                  {selectedTicket.customerName.charAt(0)}
                </div>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">{selectedTicket.customerName}</h3>
            <p className="text-sm text-slate-500 mt-1">Cliente desde 2023</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ações de Lead</h4>
              <div className="space-y-2">
                <button onClick={async () => {
                  const ticketResponse = await axios.get(`/api/tickets/${selectedTicket.id}`);
                  const customerId = ticketResponse.data.customerId;
                  if (customerId) {
                    try {
                      const customerResponse = await axios.get(`/api/customers/${customerId}`);
                      setCustomerForModal(customerResponse.data);
                    } catch (error) {
                      // Fallback
                      setCustomerForModal({
                        id: selectedTicket.customerId || '',
                        name: selectedTicket.customerName,
                        email: selectedTicket.customerEmail || '',
                        phone: selectedTicket.customerPhone || '',
                        cpf: '',
                        address: '',
                        notes: '',
                        status: 'lead',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                    }
                  } else {
                    setCustomerForModal({
                      id: '',
                      name: selectedTicket.customerName || '',
                      email: selectedTicket.customerEmail || '',
                      phone: selectedTicket.customerPhone || '',
                      cpf: '',
                      address: '',
                      notes: '',
                      status: 'lead',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                  }
                  setIsCustomerModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
              <span className="flex items-center gap-2"><User className="w-4 h-4" /> {selectedTicket.customerId ? 'Ficha do Cliente' : 'Criar Cliente'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab?.('kanban')} className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium">
              <span className="flex items-center gap-2"><Trello className="w-4 h-4" /> Kanban Vendas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab?.('kanban')} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
              <span className="flex items-center gap-2"><Car className="w-4 h-4" /> Kanban Captação</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Detalhes do Contato</h4>
          <div className="space-y-3">
            {selectedTicket.customerEmail && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700 break-all">{selectedTicket.customerEmail}</span>
              </div>
            )}
            {selectedTicket.customerPhone && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700">{selectedTicket.customerPhone}</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <ChannelIcon channel={selectedTicket.channel} className="w-4 h-4 mt-0.5" />
              <span className="text-sm text-slate-700 capitalize">Origem: {selectedTicket.channel}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</h4>
            {tagFilter !== 'all' && (
              <button onClick={() => setTagFilter('all')} className="text-[10px] text-blue-600 hover:underline">Limpar Filtro</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTicket.tags && selectedTicket.tags.map(tag => (
              <button 
                key={tag} 
                onClick={() => setTagFilter(tagFilter === tag ? 'all' : tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  tagFilter === tag ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
            {isAddingTag ? (
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAddTag(newTag); }} 
                className="inline-flex items-center gap-1"
              >
                <input 
                  type="text" 
                  autoFocus 
                  value={newTag} 
                  onChange={e => setNewTag(e.target.value)} 
                  className="w-20 px-2 py-1 text-xs border border-blue-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Nova tag" 
                  onBlur={() => {
                    if(!newTag.trim()) setIsAddingTag(false);
                  }}
                />
                <button type="submit" className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-md p-1">
                  <CheckCircle2 className="w-3 h-3"/>
                </button>
              </form>
            ) : (
              <button onClick={() => setIsAddingTag(true)} className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Details Modal */}
  {selectedVehicle && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{selectedVehicle.brand} {selectedVehicle.model}</h3>
            <p className="text-sm text-slate-500">{selectedVehicle.year} • {selectedVehicle.mileage === 0 ? '0 km' : `${selectedVehicle.mileage.toLocaleString('pt-BR')} km`}</p>
          </div>
          <button 
            onClick={() => setSelectedVehicle(null)} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Images */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-slate-200 rounded-xl overflow-hidden group">
                <img 
                  src={selectedVehicle.images && selectedVehicle.images.length > 0 ? selectedVehicle.images[currentImageIndex] : selectedVehicle.image} 
                  alt={selectedVehicle.model} 
                  className="w-full h-full object-cover"
                />
                
                {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                      {currentImageIndex + 1} / {selectedVehicle.images.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnails */}
              {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                  {selectedVehicle.images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative shrink-0 w-20 h-15 rounded-lg overflow-hidden snap-start transition-all ${currentImageIndex === idx ? 'ring-2 ring-blue-600 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Details */}
            <div className="space-y-6">
              <div>
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  R$ {selectedVehicle.price.toLocaleString('pt-BR')}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Preço sujeito a alteração
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Ano</div>
                  <div className="font-medium text-slate-800">{selectedVehicle.year}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Quilometragem</div>
                  <div className="font-medium text-slate-800">{selectedVehicle.mileage === 0 ? '0 km' : `${selectedVehicle.mileage.toLocaleString('pt-BR')} km`}</div>
                </div>
                {selectedVehicle.transmission && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Câmbio</div>
                    <div className="font-medium text-slate-800 capitalize">{selectedVehicle.transmission}</div>
                  </div>
                )}
                {selectedVehicle.fuel && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Combustível</div>
                    <div className="font-medium text-slate-800 capitalize">{selectedVehicle.fuel}</div>
                  </div>
                )}
                {selectedVehicle.color && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Cor</div>
                    <div className="font-medium text-slate-800 capitalize">{selectedVehicle.color}</div>
                  </div>
                )}
                {selectedVehicle.plate && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Placa</div>
                    <div className="font-medium text-slate-800 uppercase">{selectedVehicle.plate}</div>
                  </div>
                )}
              </div>

              {selectedVehicle.description && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Descrição</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {selectedVehicle.description}
                  </div>
                </div>
              )}

              {selectedVehicle.features && selectedVehicle.features.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Opcionais</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedVehicle.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="capitalize">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={() => setSelectedVehicle(null)}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
            <Share2 className="w-4 h-4" /> Compartilhar Veículo
          </button>
        </div>
      </div>
    </div>
  )}
  {/* Customer Modal */}
  <CustomerModal
    isOpen={isCustomerModalOpen}
    onClose={() => setIsCustomerModalOpen(false)}
    customer={customerForModal}
    isEditingInitial={!customerForModal}
    onSave={async (savedCustomer) => {
      if (selectedTicket) {
        try {
          await axios.put(`/api/tickets/${selectedTicket.id}`, {
            customerId: savedCustomer.id,
            customerName: savedCustomer.name,
            customerEmail: savedCustomer.email || selectedTicket.customerEmail,
            customerPhone: savedCustomer.phone || selectedTicket.customerPhone
          });
        } catch (error) {
          console.error("Error updating ticket with customer info:", error);
        }
      }
    }}
  />
</div>
  );
}
