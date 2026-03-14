import { useState, useEffect } from 'react';
import { Search, Monitor } from 'lucide-react';
import { Dialog } from '@headlessui/react';

export default function GlobalSearchModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-start justify-center p-4 pt-24 sm:pt-32">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-2xl transition-all">
                    <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                        <Search className="h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="h-full w-full border-0 bg-transparent px-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-0 sm:text-sm"
                            placeholder="Buscar contatos, tickets ou ações..."
                            autoFocus
                        />
                        <div className="ml-2 flex flex-shrink-0 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-400">
                            <Monitor className="h-3 w-3" />
                            <span>Esc</span>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto px-4 py-4 sm:px-6">
                        <p className="text-sm text-gray-500">Digite para buscar globalmente no sistema.</p>
                        {/* Resultados da busca virão aqui */}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
