import { useState } from 'react';
import { Search, Plus, Filter, Download, MoreHorizontal } from 'lucide-react';

const DUMMY_CONTACTS = [
    { id: 1, name: 'João Silva', email: 'joao@example.com', phone: '+55 11 99999-0001', tags: ['Corolla', 'Financiamento'], created_at: '2023-10-01' },
    { id: 2, name: 'Maria Souza', email: 'maria@example.com', phone: '+55 11 99999-0002', tags: ['Renegade'], created_at: '2023-10-02' },
    { id: 3, name: 'Carlos Moura', email: 'carlos@example.com', phone: '+55 11 99999-0003', tags: ['T-Cross', 'A Vista'], created_at: '2023-10-05' },
];

export default function ContactsTable() {
    const [search, setSearch] = useState('');

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full overflow-hidden">
            {/* Header / Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Base de Contatos</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar contatos..." 
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Filter className="h-4 w-4" /> Filtros
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Download className="h-4 w-4" /> Exportar
                    </button>
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
                        <Plus className="h-4 w-4" /> Novo Contato
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300 sticky top-0">
                        <tr>
                            <th scope="col" className="p-4 w-10">
                                <input type="checkbox" title="Selecionar Todos" aria-label="Selecionar Todos" className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500" />
                            </th>
                            <th scope="col" className="px-6 py-3">Nome</th>
                            <th scope="col" className="px-6 py-3">Celular</th>
                            <th scope="col" className="px-6 py-3">E-mail</th>
                            <th scope="col" className="px-6 py-3">Tags</th>
                            <th scope="col" className="px-6 py-3">Criado em</th>
                            <th scope="col" className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DUMMY_CONTACTS.map((contact) => (
                            <tr key={contact.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="w-4 p-4">
                                    <input type="checkbox" title="Selecionar" aria-label="Selecionar" className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500" />
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold dark:bg-indigo-900/50 dark:text-indigo-400">
                                        {contact.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {contact.name}
                                </td>
                                <td className="px-6 py-4">{contact.phone}</td>
                                <td className="px-6 py-4">{contact.email}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1 flex-wrap">
                                        {contact.tags.map(tag => (
                                            <span key={tag} className="bg-indigo-50 text-indigo-600 text-[10px] font-medium px-2 py-0.5 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{contact.created_at}</td>
                                <td className="px-6 py-4 text-right">
                                    <button title="Opções do Contato" aria-label="Opções" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900 shrink-0">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Mostrando <span className="font-semibold text-gray-900 dark:text-white">1</span> a <span className="font-semibold text-gray-900 dark:text-white">3</span> de <span className="font-semibold text-gray-900 dark:text-white">3</span> Resultados
                </span>
                <div className="inline-flex mt-2 xs:mt-0">
                    <button className="flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-s hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        Anterior
                    </button>
                    <button className="flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-e hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        Próximo
                    </button>
                </div>
            </div>
        </div>
    );
}
