import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser } from '../types';

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Equipe e Acessos</h2>
            <p className="text-sm text-slate-500 mt-1">Gerencie os usuários, níveis de acesso e caixas de entrada.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Nível de Acesso</th>
                  <th className="px-6 py-4">Caixas de Entrada Designadas</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        user.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {user.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                        {user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gerente' : 'Atendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.inboxes?.map(inbox => (
                          <span key={inbox} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">
                            {inbox}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-2">Atendente</h4>
            <p className="text-sm text-slate-500">Acesso apenas às caixas de entrada designadas. Pode enviar mensagens, usar respostas prontas e criar leads. Sem acesso a configurações.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-2">Gerente</h4>
            <p className="text-sm text-slate-500">Acesso a relatórios, dashboard e todas as caixas de entrada da equipe. Pode reatribuir tickets e monitorar conversas.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-2">Administrador</h4>
            <p className="text-sm text-slate-500">Acesso total. Pode alterar configurações do bot, integrações, gerenciar usuários e ter caixas de entrada exclusivas (ex: Diretoria).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
