import { PropsWithChildren, ReactNode } from 'react';
import GlobalHeader from '@/Components/GlobalHeader';

interface KinboxLayoutProps extends PropsWithChildren {
    sidebar?: ReactNode; // A barra lateral esquerda (sub-menus) injetada por cada módulo
}

export default function KinboxLayout({ children, sidebar }: KinboxLayoutProps) {
    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans">
            <GlobalHeader />
            <div className="flex h-[calc(100vh-3.5rem)] flex-1 overflow-hidden">
                {/* Secondary Sidebar (Left) */}
                {sidebar && (
                    <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900">
                        {sidebar}
                    </aside>
                )}
                
                {/* Main Content Area */}
                <main className="flex-1 w-full flex flex-col min-w-0 bg-white dark:bg-gray-900 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
