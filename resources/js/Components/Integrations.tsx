import React, { useState, useEffect } from 'react';
import { Instagram, MessageCircle, Copy, CheckCircle2, ExternalLink, Save, Plus, Trash2, Edit2, X, Users, Inbox as InboxIcon } from 'lucide-react';
import axios from 'axios';

interface Inbox {
  id: string;
  name: string;
  channel: 'whatsapp' | 'instagram';
  settings: any;
  access_type: 'all' | 'specific';
  accessType?: 'all' | 'specific';
  allowed_users: string[];
  allowedUsers?: string[];
  createdAt?: string;
  created_at?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Integrations() {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInbox, setEditingInbox] = useState<Inbox | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'instagram'>('whatsapp');
  const [accessType, setAccessType] = useState<'all' | 'specific'>('all');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inboxesRes, usersRes] = await Promise.all([
          axios.get('/api/inboxes'),
          axios.get('/api/users')
        ]);
        setInboxes(inboxesRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const openModal = (inbox?: Inbox) => {
    if (inbox) {
      setEditingInbox(inbox);
      setName(inbox.name);
      setChannel(inbox.channel);
      setAccessType(inbox.access_type || inbox.accessType || 'all');
      setAllowedUsers(inbox.allowed_users || inbox.allowedUsers || []);
      setSettings(inbox.settings || {});
    } else {
      setEditingInbox(null);
      setName('');
      setChannel('whatsapp');
      setAccessType('all');
      setAllowedUsers([]);
      setSettings({});
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInbox(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const inboxData = {
        name,
        channel,
        accessType,
        allowedUsers: accessType === 'specific' ? allowedUsers : [],
        settings,
        createdAt: editingInbox ? editingInbox.createdAt : new Date().toISOString()
      };

      if (editingInbox) {
        await axios.put(`/api/inboxes/${editingInbox.id}`, inboxData);
      } else {
        await axios.post('/api/inboxes', inboxData);
      }
      
      // Update local state temporarily, the polling will refresh it
      closeModal();
    } catch (error) {
      console.error("Error saving inbox:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta caixa de entrada?')) {
      try {
        await axios.delete(`/api/inboxes/${id}`);
      } catch (error) {
        console.error("Error deleting inbox:", error);
      }
    }
  };

  const toggleUser = (userId: string) => {
    setAllowedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const webhookUrl = `${window.location.origin}/api/webhook`;

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Caixas de Entrada (Integrações)</h2>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Caixa de Entrada
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inboxes.map(inbox => (
            <div key={inbox.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${inbox.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                    {inbox.channel === 'whatsapp' ? <MessageCircle className="w-5 h-5" /> : <Instagram className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{inbox.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{inbox.channel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openModal(inbox)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(inbox.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>Acesso: {(inbox.access_type || inbox.accessType) === 'all' ? 'Todos os operadores' : `${(inbox.allowed_users || inbox.allowedUsers || []).length} operador(es) específico(s)`}</span>
                </div>
                {inbox.channel === 'whatsapp' && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Instância:</span> {inbox.settings.evolutionInstance || 'Não configurada'}
                  </div>
                )}
                {inbox.channel === 'instagram' && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Page ID:</span> {inbox.settings.instagramPageId || 'Não configurado'}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {inboxes.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <InboxIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">Nenhuma caixa de entrada</h3>
              <p className="text-slate-500 mb-4">Adicione sua primeira caixa de entrada para começar a receber mensagens.</p>
              <button 
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Caixa de Entrada
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingInbox ? 'Editar Caixa de Entrada' : 'Nova Caixa de Entrada'}
              </h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="inbox-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Caixa</label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Suporte WhatsApp"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="whatsapp">WhatsApp (Evolution API)</option>
                      <option value="instagram">Instagram (Meta API)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Permissões de Acesso</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="radio" 
                        name="accessType" 
                        value="all" 
                        checked={accessType === 'all'}
                        onChange={() => setAccessType('all')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Todos os operadores</div>
                        <div className="text-xs text-slate-500">Qualquer usuário do sistema pode ver e responder mensagens desta caixa.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="radio" 
                        name="accessType" 
                        value="specific" 
                        checked={accessType === 'specific'}
                        onChange={() => setAccessType('specific')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Operadores específicos</div>
                        <div className="text-xs text-slate-500">Apenas os usuários selecionados terão acesso a esta caixa.</div>
                      </div>
                    </label>
                  </div>

                  {accessType === 'specific' && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-3">Selecione os operadores:</p>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {users.map(user => (
                          <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={allowedUsers.includes(user.id)}
                              onChange={() => toggleUser(user.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 truncate">{user.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Configurações da API</h3>
                  
                  {channel === 'whatsapp' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 mb-4">
                        <p className="font-medium mb-1">URL do Webhook para configurar na Evolution API:</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 block p-2 bg-white rounded border border-blue-200 font-mono text-xs overflow-x-auto">
                            {`${webhookUrl}/evolution`}
                          </code>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Instância (Evolution)</label>
                        <input 
                          type="text"
                          required
                          value={settings.evolutionInstance || ''}
                          onChange={(e) => setSettings({...settings, evolutionInstance: e.target.value})}
                          placeholder="Ex: whatsapp_suporte"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Evolution API URL</label>
                        <input 
                          type="url"
                          required
                          value={settings.evolutionApiUrl || ''}
                          onChange={(e) => setSettings({...settings, evolutionApiUrl: e.target.value})}
                          placeholder="https://sua-api.evolution.com"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Global API Key</label>
                        <input 
                          type="password"
                          required
                          value={settings.evolutionApiKey || ''}
                          onChange={(e) => setSettings({...settings, evolutionApiKey: e.target.value})}
                          placeholder="Sua API Key"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 mb-4">
                        <p className="font-medium mb-1">URL do Webhook para configurar no Meta for Developers:</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 block p-2 bg-white rounded border border-blue-200 font-mono text-xs overflow-x-auto">
                            {`${webhookUrl}/instagram`}
                          </code>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Verify Token (Webhook)</label>
                        <input 
                          type="text"
                          required
                          value={settings.instagramVerifyToken || 'elitecrm_instagram_token'}
                          onChange={(e) => setSettings({...settings, instagramVerifyToken: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Page Access Token</label>
                        <input 
                          type="password"
                          required
                          value={settings.instagramPageAccessToken || ''}
                          onChange={(e) => setSettings({...settings, instagramPageAccessToken: e.target.value})}
                          placeholder="EAA..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Page ID</label>
                        <input 
                          type="text"
                          required
                          value={settings.instagramPageId || ''}
                          onChange={(e) => setSettings({...settings, instagramPageId: e.target.value})}
                          placeholder="1234567890"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
              <button 
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="inbox-form"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Caixa de Entrada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
