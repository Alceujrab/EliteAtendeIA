import { Link, usePage } from '@inertiajs/react';
import { Inbox, Users, BarChart2, Settings, Bell, Calendar, AtSign, Building } from 'lucide-react';
import Dropdown from '@/Components/Dropdown';
import GlobalSearchModal from './GlobalSearchModal';

export default function GlobalHeader() {
    const user = usePage().props.auth.user;
    
    // Função helper simplificada para checar rota ativa (simulada)
    const isRouteActive = (prefix: string) => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.startsWith(prefix);
        }
        return false;
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-6">
                {/* Logo or Brand */}
                <div className="flex shrink-0 items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                            K
                        </div>
                    </Link>
                </div>

                {/* Busca Global (Simulado via Modal) */}
                <div className="hidden sm:block">
                    <button
                        className="flex w-64 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                    >
                        <SearchIcon className="h-4 w-4" />
                        <span>Pesquisar...</span>
                        <span className="ml-auto flex items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-900">
                            <kbd>Ctrl</kbd> <kbd>K</kbd>
                        </span>
                    </button>
                    <GlobalSearchModal />
                </div>

                {/* Navegação Principal */}
                <nav className="hidden md:flex gap-1">
                    <NavLink href="/inbox/all" active={isRouteActive('/inbox')} icon={<Inbox className="h-4 w-4" />} label="Caixa de Entrada" />
                    <NavLink href="/crm" active={isRouteActive('/crm')} icon={<Users className="h-4 w-4" />} label="CRM" />
                    <NavLink href="/reports" active={isRouteActive('/reports')} icon={<BarChart2 className="h-4 w-4" />} label="Relatórios" />
                    <NavLink href="/settings" active={isRouteActive('/settings')} icon={<Settings className="h-4 w-4" />} label="Configurações" />
                </nav>
            </div>

            {/* Ações Rápidas & Perfil */}
            <div className="flex items-center gap-3">
                <button title="Notificações" aria-label="Notificações" className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                </button>
                <button title="Calendário" aria-label="Calendário" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Calendar className="h-5 w-5" />
                </button>
                <button title="Menções" aria-label="Menções" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <AtSign className="h-5 w-5" />
                </button>

                <div className="ml-2 hidden h-5 w-px bg-gray-200 dark:bg-gray-700 sm:block"></div>

                {/* Workspace Selector */}
                <span className="hidden items-center gap-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 sm:flex">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>Elite Veículos</span>
                </span>

                {/* User Dropdown */}
                <Dropdown>
                    <Dropdown.Trigger>
                        <button className="flex items-center gap-2 rounded-full ring-2 ring-transparent transition-all focus:outline-none focus:ring-indigo-500">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content align="right" width="48">
                        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                            <p className="text-sm">Logado como</p>
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {user?.email}
                            </p>
                        </div>
                        <Dropdown.Link href={route('profile.edit')}>Minha conta</Dropdown.Link>
                        <Dropdown.Link href="/settings">Configurações globais</Dropdown.Link>
                        <Dropdown.Link href={route('logout')} method="post" as="button">
                            Sair
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </header>
    );
}

function NavLink({ href, active, icon, label }: { href: string; active?: boolean; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`}
        >
            {icon}
            {label}
        </Link>
    );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}
