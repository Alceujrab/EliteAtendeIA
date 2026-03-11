import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, FileText, Users, PieChart as PieChartIcon, Car, TrendingUp, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, AppUser, Ticket } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const leadsQ = query(collection(db, 'leads'));
    const unsubscribeLeads = onSnapshot(leadsQ, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    const usersQ = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppUser[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const ticketsQ = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(ticketsQ, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));

    return () => {
      unsubscribeLeads();
      unsubscribeUsers();
      unsubscribeTickets();
    };
  }, []);

  // Calculate metrics based on data
  const agentPerformanceData = useMemo(() => {
    let usersToReport = users;
    if (selectedOperator !== 'all') {
      usersToReport = users.filter(u => u.id === selectedOperator);
    }

    return usersToReport.map(user => {
      const userLeads = leads.filter(l => l.assignedTo === user.id);
      const resolvidos = userLeads.filter(l => l.status === 'won' || l.status === 'completed').length;
      const pendentes = userLeads.filter(l => l.status !== 'won' && l.status !== 'completed' && l.status !== 'lost').length;
      
      return {
        name: user.name,
        resolvidos,
        pendentes,
        tempoMedio: Math.floor(Math.random() * 30) + 5 // Mocked for now, needs real calculation
      };
    });
  }, [selectedOperator, users, leads]);

  const leadsByStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    let filteredLeads = leads;
    if (selectedOperator !== 'all') {
      filteredLeads = leads.filter(l => l.assignedTo === selectedOperator);
    }

    filteredLeads.forEach(lead => {
      if (lead.status !== 'won' && lead.status !== 'lost' && lead.status !== 'completed') {
        statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      }
    });
    
    const statusNames: Record<string, string> = {
      new: 'Novo',
      negotiation: 'Em Negociação',
      credit: 'Aprovação de Crédito',
      interest: 'Interesse',
      evaluation: 'Avaliação',
      inspection: 'Vistoria',
      delivery: 'Preparação/Entrega',
      followup: 'Follow-up'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusNames[status] || status,
      value: count
    }));
  }, [selectedOperator, leads]);

  const createPdfBase = (title: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EliteMotors CRM', 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CNPJ: 00.000.000/0001-00', 14, 30);
    doc.text('Av. das Américas, 1000 - Rio de Janeiro, RJ', 14, 35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth - 14, 22, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: Últimos ${dateRange} dias`, pageWidth - 14, 30, { align: 'right' });
    if (selectedOperator !== 'all') {
      const opName = users.find(u => u.id === selectedOperator)?.name;
      doc.text(`Operador: ${opName || ''}`, pageWidth - 14, 35, { align: 'right' });
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 40, { align: 'right' });
    } else {
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 35, { align: 'right' });
    }

    return { doc, pageWidth };
  };

  const addFooterAndSave = (doc: jsPDF, pageWidth: number, filename: string) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${i} de ${pageCount} - Gerado por EliteMotors CRM`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    doc.save(filename);
  };

  const generateAgentReport = () => {
    const { doc, pageWidth } = createPdfBase('Desempenho por Operador');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Atendimentos por Operador', 14, 60);
    
    const agentTableData = agentPerformanceData.map(agent => [
      agent.name,
      agent.resolvidos.toString(),
      agent.pendentes.toString(),
      `${agent.tempoMedio} min`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Operador', 'Resolvidos', 'Pendentes', 'Tempo Médio de Resposta']],
      body: agentTableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    addFooterAndSave(doc, pageWidth, 'relatorio-operadores.pdf');
  };

  const generateStatusReport = () => {
    const { doc, pageWidth } = createPdfBase('Leads por Status');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Leads Abertos por Status', 14, 60);

    const leadsTableData = leadsByStatusData.map(item => [
      item.name,
      item.value.toString()
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Status do Lead', 'Quantidade']],
      body: leadsTableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    addFooterAndSave(doc, pageWidth, 'relatorio-status.pdf');
  };

  const generateVehiclesReport = () => {
    const { doc, pageWidth } = createPdfBase('Veículos Mais Procurados');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Veículos Mais Procurados', 14, 60);

    const vehicleCounts: Record<string, number> = {};
    let filteredLeads = leads;
    if (selectedOperator !== 'all') {
      filteredLeads = leads.filter(l => l.assignedTo === selectedOperator);
    }

    filteredLeads.forEach(lead => {
      vehicleCounts[lead.vehicleName] = (vehicleCounts[lead.vehicleName] || 0) + 1;
    });

    const topVehiclesData = Object.entries(vehicleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([vehicle, count], index) => [`${index + 1}º`, vehicle, count.toString()]);

    autoTable(doc, {
      startY: 70,
      head: [['Posição', 'Veículo', 'Quantidade de Leads']],
      body: topVehiclesData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    addFooterAndSave(doc, pageWidth, 'relatorio-veiculos.pdf');
  };

  const generateFunnelReport = () => {
    const { doc, pageWidth } = createPdfBase('Funil de Vendas');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise do Funil de Vendas', 14, 60);

    let filteredLeads = leads;
    if (selectedOperator !== 'all') {
      filteredLeads = leads.filter(l => l.assignedTo === selectedOperator);
    }

    const funnelData = [
      ['Novos', filteredLeads.filter(l => l.status === 'new').length.toString()],
      ['Em Negociação', filteredLeads.filter(l => l.status === 'negotiation').length.toString()],
      ['Aprovação de Crédito', filteredLeads.filter(l => l.status === 'credit').length.toString()],
      ['Vendas Concluídas', filteredLeads.filter(l => l.status === 'won').length.toString()],
      ['Vendas Perdidas', filteredLeads.filter(l => l.status === 'lost').length.toString()]
    ];

    autoTable(doc, {
      startY: 70,
      head: [['Etapa do Funil', 'Quantidade']],
      body: funnelData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    addFooterAndSave(doc, pageWidth, 'relatorio-funil.pdf');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Relatórios e Analytics</h2>
            <p className="text-sm text-slate-500 mt-1">Gere relatórios específicos e filtre por período ou operador.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-2 border-r border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filtros:</span>
            </div>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-700 text-sm font-medium outline-none cursor-pointer"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            <div className="w-px h-4 bg-slate-200"></div>
            <select 
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="bg-transparent text-slate-700 text-sm font-medium outline-none cursor-pointer"
            >
              <option value="all">Todos os Operadores</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Desempenho por Operador</h4>
              <p className="text-xs text-slate-500 mt-1">Atendimentos resolvidos, pendentes e tempo médio.</p>
            </div>
            <button onClick={generateAgentReport} className="mt-auto w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-sm font-medium transition-colors">
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Leads por Status</h4>
              <p className="text-xs text-slate-500 mt-1">Distribuição de leads nas etapas de atendimento.</p>
            </div>
            <button onClick={generateStatusReport} className="mt-auto w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-sm font-medium transition-colors">
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Veículos Procurados</h4>
              <p className="text-xs text-slate-500 mt-1">Ranking dos veículos que mais geram interesse.</p>
            </div>
            <button onClick={generateVehiclesReport} className="mt-auto w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 rounded-lg text-sm font-medium transition-colors">
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Funil de Vendas</h4>
              <p className="text-xs text-slate-500 mt-1">Conversão de leads desde a entrada até a venda.</p>
            </div>
            <button onClick={generateFunnelReport} className="mt-auto w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 rounded-lg text-sm font-medium transition-colors">
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
          </div>
        </div>

        {/* Charts Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Visão Geral: Atendimentos</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="resolvidos" name="Resolvidos" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Visão Geral: Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
