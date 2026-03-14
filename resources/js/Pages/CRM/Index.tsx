import KinboxLayout from '@/Layouts/KinboxLayout';
import { Head, usePage } from '@inertiajs/react';
import KanbanBoard from '@/Components/CRM/KanbanBoard';
import ContactsTable from '@/Components/CRM/ContactsTable';
import Campaigns from '@/Components/CRM/Campaigns';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function CRMIndex() {
    const { funnelData } = usePage<any>().props;
    const [view, setView] = useState<'kanban' | 'contacts' | 'tasks' | 'campaigns'>('kanban');

    return (
        <KinboxLayout
            sidebar={
                <div className="p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">CRM</h2>
                    <ul className="space-y-2">
                        <li>
                            <button onClick={() => setView('kanban')} className={`w-full text-left text-sm font-medium p-2 rounded-md ${view === 'kanban' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                                Negociações
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setView('tasks')} className={`w-full text-left text-sm font-medium p-2 rounded-md ${view === 'tasks' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                                Tarefas
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setView('contacts')} className={`w-full text-left text-sm font-medium p-2 rounded-md ${view === 'contacts' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                                Contatos
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setView('campaigns')} className={`w-full text-left text-sm font-medium p-2 rounded-md ${view === 'campaigns' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                                Campanhas
                            </button>
                        </li>
                    </ul>
                </div>
            }
        >
            <Head title="CRM Elite" />
            
            {view === 'kanban' && (
                <div className="flex h-full flex-col w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {funnelData ? funnelData.name : 'Pipeline: Vendas de Veículos'}
                        </h1>
                        <button className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors">
                            <Plus className="h-4 w-4" />
                            Criar Funil
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <KanbanBoard initialStages={funnelData?.stages || []} />
                    </div>
                </div>
            )}

            {view === 'contacts' && <ContactsTable />}
            {view === 'campaigns' && <Campaigns />}
            {view === 'tasks' && (
                <div className="flex h-full items-center justify-center dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full text-gray-500">
                    Módulo de Tarefas em construção...
                </div>
            )}
        </KinboxLayout>
    );
}
