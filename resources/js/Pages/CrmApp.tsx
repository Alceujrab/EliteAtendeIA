import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import WebhookProcessor from '../Components/WebhookProcessor';
import Dashboard from '../Components/Dashboard';
import Inbox from '../Components/Inbox';
import Kanban from '../Components/Kanban';
import Customers from '../Components/Customers';
import Integrations from '../Components/Integrations';
import Reports from '../Components/Reports';
import Users from '../Components/Users';
import Catalog from '../Components/Catalog';
import Automation from '../Components/Automation';
import { AuthProvider } from '../AuthProvider';
import { VehicleProvider } from '../VehicleContext';
import { MessageCircle, LayoutDashboard, Trello, Users as UsersIcon, Settings, BarChart, HardDrive, Car, Bot } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('inbox');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inbox': return <Inbox setActiveTab={setActiveTab} />;
      case 'kanban': return <Kanban />;
      case 'customers': return <Customers />;
      case 'reports': return <Reports />;
      case 'users': return <Users />;
      case 'integrations': return <Integrations />;
      case 'catalog': return <Catalog />;
      case 'automation': return <Automation />;
      default: return <Inbox setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <WebhookProcessor />
      {/* Sidebar */}
      <div className="w-16 md:w-64 bg-slate-900 flex flex-col items-center md:items-stretch shadow-xl shrink-0">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded shrink-0 bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
            E
          </div>
          <span className="hidden md:block ml-3 font-bold text-white tracking-wider">EliteCRM</span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 relative">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Dashboard</span>
          </button>

          <button onClick={() => setActiveTab('inbox')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'inbox' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Caixa de Entrada</span>
          </button>

          <button onClick={() => setActiveTab('kanban')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'kanban' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <Trello className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Kanban (CRM)</span>
          </button>

          <button onClick={() => setActiveTab('customers')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'customers' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <UsersIcon className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Clientes</span>
          </button>

          <button onClick={() => setActiveTab('catalog')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'catalog' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <Car className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Catálogo</span>
          </button>

          <button onClick={() => setActiveTab('reports')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'reports' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <BarChart className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Relatórios</span>
          </button>

          <div className="px-4 md:px-6 mt-6 mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:block">Sistema</p>
            <div className="h-px bg-slate-800 mt-2 md:hidden"></div>
          </div>

          <button onClick={() => setActiveTab('integrations')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'integrations' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <HardDrive className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Integrações</span>
          </button>

          <button onClick={() => setActiveTab('automation')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'automation' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <Bot className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Automação & Chatbot</span>
          </button>

          <button onClick={() => setActiveTab('users')} className={`flex items-center px-4 md:px-6 py-3 transition-colors ${activeTab === 'users' ? 'bg-blue-600/10 text-blue-500 border-r-[3px] border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
            <Settings className="w-5 h-5 shrink-0" />
            <span className="hidden md:block ml-3 font-medium text-sm">Configurações</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {renderContent()}
      </div>
    </div>
  );
}

export default function CrmApp() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <Head title="Crm" />
        <AppContent />
      </VehicleProvider>
    </AuthProvider>
  );
}
