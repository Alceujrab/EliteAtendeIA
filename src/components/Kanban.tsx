import React, { useState, useMemo, useEffect } from 'react';
import { Lead, Message } from '../types';
import { MoreHorizontal, Phone, DollarSign, Car, EyeOff, Eye, Filter, Edit2, Bot, Clock, Calendar, MessageSquare, CheckCircle2, Send, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleGenAI, Type } from '@google/genai';

const salesColumns = [
  { id: 'new', title: 'Novo Lead' },
  { id: 'negotiation', title: 'Em Negociação' },
  { id: 'credit', title: 'Aprovação de Crédito' },
  { id: 'won', title: 'Venda Concluída' },
  { id: 'lost', title: 'Venda Não Concluída' }
];

const sourcingColumns = [
  { id: 'interest', title: 'Interesse / Lead' },
  { id: 'evaluation', title: 'Avaliação Online' },
  { id: 'inspection', title: 'Vistoria Presencial' },
  { id: 'bought', title: 'Veículo Comprado' }
];

const postSalesColumns = [
  { id: 'delivery', title: 'Preparação / Entrega' },
  { id: 'docs', title: 'Documentação' },
  { id: 'followup', title: 'Follow-up (7 dias)' },
  { id: 'completed', title: 'Finalizado' }
];

export default function Kanban() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'sourcing' | 'post_sales'>('sales');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  // Edit Modal
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // AI Modal
  const [aiLead, setAiLead] = useState<Lead | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [selectedInboxId, setSelectedInboxId] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Create Lead Modal
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    customerName: '',
    customerPhone: '',
    vehicleName: '',
    value: 0,
    status: 'new',
    type: 'sales'
  });

  useEffect(() => {
    const q = query(collection(db, 'inboxes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedInboxes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInboxes(fetchedInboxes);
      if (fetchedInboxes.length > 0 && !selectedInboxId) {
        setSelectedInboxId(fetchedInboxes[0].id);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(fetchedUsers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'leads'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(fetchedLeads);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (aiLead) {
      fetchSuggestions(aiLead);
    } else {
      setAiSuggestions([]);
      setDraftMessage('');
    }
  }, [aiLead]);

  const fetchSuggestions = async (lead: Lead) => {
    setIsLoadingSuggestions(true);
    setAiSuggestions([]);
    try {
      // Find the ticket for this lead
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('customerPhone', '==', lead.customerPhone), limit(1));
      const ticketSnapshot = await getDocs(q);
      
      let conversationText = '';
      if (!ticketSnapshot.empty) {
        const ticketId = ticketSnapshot.docs[0].id;
        const messagesRef = collection(db, `tickets/${ticketId}/messages`);
        const messagesQ = query(messagesRef, orderBy('timestamp', 'desc'), limit(10));
        const messagesSnapshot = await getDocs(messagesQ);
        const messages = messagesSnapshot.docs.map(doc => doc.data() as Message).reverse();
        
        conversationText = messages.map(m => `${m.sender === 'customer' ? 'Cliente' : 'Atendente'}: ${m.text}`).join('\n');
      }

      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Você é um assistente de vendas de uma concessionária de veículos.
        O cliente ${lead.customerName} está interessado no veículo ${lead.vehicleName}.
        O status atual do negócio é: ${salesColumns.find(c => c.id === lead.status)?.title || lead.status}.
        
        ${conversationText ? `Aqui está o histórico recente de conversas:\n${conversationText}\n` : 'Não há histórico de conversas recente.'}
        
        Gere 3 sugestões de mensagens curtas e persuasivas (máximo 2 frases cada) que o atendente pode enviar para o cliente via WhatsApp para avançar a negociação.
        Retorne APENAS um JSON com um array de strings chamado "suggestions".
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      const jsonStr = response.text?.trim() || '{"suggestions":[]}';
      const parsed = JSON.parse(jsonStr);
      setAiSuggestions(parsed.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      // Fallback to default suggestions if AI fails
      setAiSuggestions([
        `Olá ${lead.customerName.split(' ')[0]}, ainda tem interesse no ${lead.vehicleName}? Podemos melhorar a condição...`,
        `Gostaria de agendar um test drive no ${lead.vehicleName} esta semana?`
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSendMessage = async () => {
    if (!aiLead || !draftMessage.trim() || !selectedInboxId) return;
    
    setIsSending(true);
    try {
      const inbox = inboxes.find(i => i.id === selectedInboxId);
      if (!inbox) throw new Error('Caixa de entrada não encontrada');

      const endpoint = inbox.channel === 'instagram' ? '/api/send/instagram' : '/api/send/whatsapp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipientId: aiLead.customerPhone, 
          text: draftMessage, 
          settings: inbox.settings 
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error("Failed to send message:", data.error);
        alert("Erro ao enviar mensagem: " + data.error);
      } else {
        setDraftMessage('');
        alert("Mensagem enviada com sucesso!");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Erro ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.customerName || !newLead.customerPhone || !newLead.vehicleName) {
      alert('Preencha os campos obrigatórios (Nome, Telefone e Veículo).');
      return;
    }

    const leadData: Omit<Lead, 'id'> = {
      customerName: newLead.customerName,
      customerPhone: newLead.customerPhone,
      vehicleName: newLead.vehicleName,
      value: newLead.value || 0,
      status: newLead.status || 'new',
      type: newLead.type || 'sales',
      createdAt: new Date().toISOString(),
      lastEditedBy: appUser?.name || 'Sistema',
      assignedTo: filterUser !== 'all' ? filterUser : undefined
    };

    try {
      await addDoc(collection(db, 'leads'), leadData);
      setIsCreatingLead(false);
      setNewLead({
        customerName: '',
        customerPhone: '',
        vehicleName: '',
        value: 0,
        status: 'new',
        type: 'sales'
      });
    } catch (error) {
      console.error("Error creating lead:", error);
      alert("Erro ao criar lead.");
    }
  };

  const columns = activeTab === 'sales' ? salesColumns : activeTab === 'sourcing' ? sourcingColumns : postSalesColumns;

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.type !== activeTab) return false;
      if (filterUser !== 'all' && l.assignedTo !== filterUser) return false;
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      
      if (filterDate !== 'all' && l.createdAt) {
        const leadDate = new Date(l.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24));
        
        if (filterDate === 'today' && diffDays > 0) return false;
        if (filterDate === 'week' && diffDays > 7) return false;
        if (filterDate === 'month' && diffDays > 30) return false;
      }
      
      return true;
    });
  }, [leads, activeTab, filterUser, filterStatus, filterDate]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) return;

    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        status: columnId,
        lastEditedBy: appUser?.name || 'Desconhecido'
      });

      // If moving to 'won' in sales, automatically create a post_sales copy
      if (activeTab === 'sales' && columnId === 'won' && lead.status !== 'won') {
        const newPostSalesLead: Omit<Lead, 'id'> = {
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          vehicleName: lead.vehicleName,
          value: lead.value,
          type: 'post_sales',
          status: 'delivery',
          lastEditedBy: appUser?.name || 'Sistema',
          createdAt: new Date().toISOString(),
          postSalesData: {
            documentationStatus: 'Pendente',
            insuranceOffered: false,
            sevenDayCheckupDone: false
          }
        };
        await addDoc(collection(db, 'leads'), newPostSalesLead);
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      alert("Erro ao atualizar status do lead.");
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns(prev => 
      prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]
    );
  };

  const saveLead = async (updatedLead: Lead) => {
    try {
      const { id, ...leadData } = updatedLead;
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        ...leadData,
        lastEditedBy: appUser?.name || 'Desconhecido'
      });
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Erro ao salvar lead.");
    }
  };

  const getDaysOpen = (createdAt?: string) => {
    if (!createdAt) return 0;
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const handleAIAssist = (lead: Lead) => {
    setAiLead(lead);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Kanban de Negócios</h2>
            <p className="text-sm text-slate-500 mt-1">Gerencie o funil de vendas, captação e pós-venda.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setNewLead({
                  customerName: '',
                  customerPhone: '',
                  vehicleName: '',
                  value: 0,
                  type: activeTab,
                  status: activeTab === 'sales' ? 'new' : activeTab === 'sourcing' ? 'interest' : 'delivery'
                });
                setIsCreatingLead(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Lead
            </button>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Vendas
              </button>
              <button 
                onClick={() => setActiveTab('sourcing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sourcing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Captação
              </button>
              <button 
                onClick={() => setActiveTab('post_sales')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'post_sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Pós-Venda
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filtros:</span>
          
          <select 
            value={filterUser} 
            onChange={(e) => setFilterUser(e.target.value)}
            className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todos os Usuários</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          <select 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Qualquer Data</option>
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map(col => {
            const isHidden = hiddenColumns.includes(col.id);
            const colLeads = filteredLeads.filter(l => l.status === col.id);

            if (isHidden) {
              return (
                <div key={col.id} className="w-16 flex flex-col bg-slate-200/50 rounded-xl border border-slate-300/60 overflow-hidden items-center py-4 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => toggleColumnVisibility(col.id)}>
                  <Eye className="w-5 h-5 text-slate-500 mb-4" />
                  <div className="writing-vertical-rl transform rotate-180 text-sm font-semibold text-slate-600 tracking-wider">
                    {col.title} ({colLeads.length})
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={col.id} 
                className="w-80 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="p-4 border-b border-slate-200/60 bg-slate-100 flex justify-between items-center group">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    {col.title}
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                      {colLeads.length}
                    </span>
                  </h3>
                  <button 
                    onClick={() => toggleColumnVisibility(col.id)}
                    className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ocultar coluna"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {colLeads.map(lead => {
                    const daysOpen = getDaysOpen(lead.createdAt);
                    const isStale = daysOpen > 5 && lead.status !== 'won' && lead.status !== 'lost' && lead.status !== 'bought' && lead.status !== 'completed';

                    return (
                      <div 
                        key={lead.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`bg-white p-4 rounded-lg border ${isStale ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'} shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing relative group`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {lead.avatar ? <img src={lead.avatar} className="w-full h-full rounded-full object-cover" /> : lead.customerName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{lead.customerName}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.customerPhone}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleAIAssist(lead)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Assistente IA">
                              <Bot className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingLead(lead)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded p-2 mb-3">
                          <p className="text-xs font-medium text-slate-700 flex items-center gap-1 mb-1"><Car className="w-3 h-3 text-slate-400" /> {lead.vehicleName}</p>
                          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {lead.value.toLocaleString('pt-BR')}</p>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className={isStale ? 'text-amber-600 font-medium' : ''}>{daysOpen} dias</span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic">
                            Modificado por: {lead.lastEditedBy || 'Sistema'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Editar Negócio</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <input 
                  type="text" 
                  value={editingLead.customerName}
                  onChange={(e) => setEditingLead({...editingLead, customerName: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input 
                  type="text" 
                  value={editingLead.customerPhone || ''}
                  onChange={(e) => setEditingLead({...editingLead, customerPhone: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Veículo</label>
                <input 
                  type="text" 
                  value={editingLead.vehicleName}
                  onChange={(e) => setEditingLead({...editingLead, vehicleName: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={editingLead.value}
                  onChange={(e) => setEditingLead({...editingLead, value: Number(e.target.value)})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  value={editingLead.status}
                  onChange={(e) => setEditingLead({...editingLead, status: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                >
                  {(editingLead.type === 'sales' ? salesColumns : editingLead.type === 'sourcing' ? sourcingColumns : postSalesColumns).map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                <select 
                  value={editingLead.assignedTo || ''}
                  onChange={(e) => setEditingLead({...editingLead, assignedTo: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                >
                  <option value="">Não atribuído</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => saveLead(editingLead)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {aiLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Assistente IA - {aiLead.customerName}</h3>
                  <p className="text-sm text-slate-500">{aiLead.vehicleName} • Aberto há {getDaysOpen(aiLead.createdAt)} dias</p>
                </div>
              </div>
              <button onClick={() => setAiLead(null)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sugestões de Ação */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Sugestões da IA
                </h4>
                
                {isLoadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-slate-200 rounded-lg bg-slate-50">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <p className="text-sm text-slate-500">Analisando histórico e gerando sugestões...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setDraftMessage(suggestion)}
                        className="w-full text-left p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <p className="font-medium text-sm text-slate-800">Opção {idx + 1}</p>
                        <p className="text-xs text-slate-500 mt-1">"{suggestion}"</p>
                      </button>
                    ))}
                    {aiSuggestions.length === 0 && (
                      <p className="text-sm text-slate-500 italic text-center p-4">Nenhuma sugestão disponível.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Lembretes e Agendamentos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Agendar Lembretes
                </h4>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Cobrar Documentação</p>
                      <p className="text-xs text-slate-500">Avisar operador em 2 dias se doc não entregue</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Mensagem de Aniversário</p>
                      <p className="text-xs text-slate-500">Programar envio automático no aniversário</p>
                    </div>
                  </label>
                  
                  <div className="pt-3 border-t border-slate-200 mt-3">
                    <input type="text" placeholder="Lembrete personalizado..." className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2" />
                    <button className="w-full py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors">
                      Adicionar Lembrete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Envio de Mensagem */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <Send className="w-4 h-4" /> Enviar Mensagem
              </h4>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Caixa de Entrada</label>
                    <select 
                      value={selectedInboxId}
                      onChange={(e) => setSelectedInboxId(e.target.value)}
                      className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    >
                      {inboxes.map(inbox => (
                        <option key={inbox.id} value={inbox.id}>{inbox.name} ({inbox.channel})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone do Cliente</label>
                    <input 
                      type="text" 
                      value={aiLead.customerPhone || ''}
                      readOnly
                      className="w-full border-slate-300 rounded-lg shadow-sm bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                  <textarea 
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    rows={3}
                    placeholder="Digite a mensagem ou selecione uma sugestão acima..."
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleSendMessage}
                    disabled={isSending || !draftMessage.trim() || !selectedInboxId}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Enviar Mensagem
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setAiLead(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {isCreatingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Novo Lead</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente *</label>
                <input 
                  type="text" 
                  value={newLead.customerName}
                  onChange={(e) => setNewLead({...newLead, customerName: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone *</label>
                <input 
                  type="text" 
                  value={newLead.customerPhone}
                  onChange={(e) => setNewLead({...newLead, customerPhone: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: +55 11 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Veículo de Interesse *</label>
                <input 
                  type="text" 
                  value={newLead.vehicleName}
                  onChange={(e) => setNewLead({...newLead, vehicleName: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: Honda Civic 2020"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={newLead.value || ''}
                  onChange={(e) => setNewLead({...newLead, value: Number(e.target.value)})}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: 120000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select 
                    value={newLead.type}
                    onChange={(e) => {
                      const type = e.target.value as 'sales' | 'sourcing' | 'post_sales';
                      const defaultStatus = type === 'sales' ? 'new' : type === 'sourcing' ? 'interest' : 'delivery';
                      setNewLead({...newLead, type, status: defaultStatus});
                    }}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  >
                    <option value="sales">Vendas</option>
                    <option value="sourcing">Captação</option>
                    <option value="post_sales">Pós-Venda</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={newLead.status}
                    onChange={(e) => setNewLead({...newLead, status: e.target.value})}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  >
                    {(newLead.type === 'sales' ? salesColumns : newLead.type === 'sourcing' ? sourcingColumns : postSalesColumns).map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreatingLead(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateLead}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Criar Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
