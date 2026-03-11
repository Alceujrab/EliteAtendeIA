import React, { useState, useEffect } from 'react';
import { X, User, Phone, FileText } from 'lucide-react';
import { addDoc, collection, doc, updateDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, Ticket } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  isEditingInitial?: boolean;
  onSave?: (customer: Customer) => void;
}

export default function CustomerModal({ isOpen, onClose, customer, isEditingInitial = false, onSave }: CustomerModalProps) {
  const [isEditing, setIsEditing] = useState(isEditingInitial);
  const [customerTickets, setCustomerTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData(customer);
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          cpf: '',
          address: '',
          notes: '',
          status: 'active'
        });
      }
      setIsEditing(isEditingInitial || !customer || !customer.id);

      if (customer && customer.id && !isEditingInitial) {
        setLoadingTickets(true);
        const fetchTickets = async () => {
          try {
            const q = query(
              collection(db, 'tickets'),
              where('customerId', '==', customer.id)
            );
            const snapshot = await getDocs(q);
            const fetchedTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            // Sort by updatedAt desc locally since we can't easily compound query without index
            fetchedTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setCustomerTickets(fetchedTickets);
          } catch (error) {
            console.error("Error fetching customer tickets:", error);
          } finally {
            setLoadingTickets(false);
          }
        };
        fetchTickets();
      } else {
        setCustomerTickets([]);
      }
    }
  }, [isOpen, customer, isEditingInitial]);

  if (!isOpen) return null;

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...dataToSave } = formData as any;

      let savedCustomer: any;
      if (customer && customer.id) {
        // Update
        const customerRef = doc(db, 'customers', customer.id);
        const updateData = {
          ...dataToSave,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(customerRef, updateData);
        savedCustomer = { ...customer, ...updateData };
      } else {
        // Create
        const newData = {
          ...dataToSave,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'customers'), newData);
        savedCustomer = { id: docRef.id, ...newData };
      }
      
      if (onSave) {
        onSave(savedCustomer);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, customer ? OperationType.UPDATE : OperationType.CREATE, 'customers');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
              {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {customer && customer.id ? (isEditing ? 'Editar Cliente' : 'Ficha do Cliente') : 'Novo Cliente'}
              </h3>
              {customer && customer.id && !isEditing && (
                <p className="text-sm text-slate-500">Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customer && customer.id && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
              >
                Editar
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isEditing ? (
            <form id="customer-form" onSubmit={handleSaveCustomer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.status || 'active'}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="active">Ativo</option>
                    <option value="lead">Lead</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF / CNPJ</label>
                  <input 
                    type="text" 
                    value={formData.cpf || ''}
                    onChange={e => setFormData({...formData, cpf: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input 
                    type="text" 
                    value={formData.address || ''}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações Internas</label>
                  <textarea 
                    rows={4}
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Anotações sobre o cliente, preferências, histórico..."
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* View Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Dados Pessoais
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Nome</p>
                      <p className="font-medium text-slate-800">{customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">CPF/CNPJ</p>
                      <p className="font-medium text-slate-800">{customer?.cpf || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium ${
                        customer?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                        customer?.status === 'lead' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {customer?.status === 'active' ? 'Ativo' : customer?.status === 'lead' ? 'Lead' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Contato
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">E-mail</p>
                      <p className="font-medium text-slate-800">{customer?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="font-medium text-slate-800">{customer?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Endereço</p>
                      <p className="font-medium text-slate-800">{customer?.address || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {customer?.notes && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Observações
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}

              {/* History Section */}
              {customer && customer.id && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Histórico de Atendimentos
                  </h4>
                  {loadingTickets ? (
                    <p className="text-sm text-slate-500">Carregando histórico...</p>
                  ) : customerTickets.length > 0 ? (
                    <div className="space-y-3">
                      {customerTickets.map(ticket => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                          <div>
                            <p className="text-sm font-medium text-slate-800 capitalize">{ticket.channel} - {ticket.status === 'open' ? 'Aberto' : ticket.status === 'pending' ? 'Pendente' : 'Fechado'}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[300px]">{ticket.lastMessage}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">{new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Nenhum atendimento registrado.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={() => isEditing && customer && customer.id ? setIsEditing(false) : onClose()}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          {isEditing && (
            <button 
              type="submit"
              form="customer-form"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Salvar Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
