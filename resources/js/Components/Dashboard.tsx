import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, CheckCircle, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import { Ticket } from '../types';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-end gap-3">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className={`flex items-center text-sm font-medium mb-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
        {trendUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {trend}
      </span>
    </div>
  </div>
);

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get('/api/tickets');
        setTickets(res.data.map((t: any) => ({...t, createdAt: t.created_at || t.createdAt})));
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;

  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.channel] = (counts[t.channel] || 0) + 1;
    });
    return [
      { name: 'WhatsApp', value: counts['whatsapp'] || 0, color: '#10b981' },
      { name: 'Instagram', value: counts['instagram'] || 0, color: '#ec4899' },
      { name: 'Email', value: counts['email'] || 0, color: '#3b82f6' },
      { name: 'Telefone', value: counts['phone'] || 0, color: '#64748b' },
    ].filter(c => c.value > 0);
  }, [tickets]);

  const weeklyData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    tickets.forEach(t => {
      const dateStr = (t as any).createdAt || t.updatedAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (date >= sevenDaysAgo) {
          counts[date.getDay()]++;
        }
      }
    });

    return days.map((day, index) => ({
      name: day,
      tickets: counts[index]
    }));
  }, [tickets]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total de Tickets (Mês)" value={totalTickets.toString()} icon={MessageSquare} trend="+12.5%" trendUp={true} />
          <StatCard title="Tickets Abertos" value={openTickets.toString()} icon={Users} trend="-5.2%" trendUp={true} />
          <StatCard title="Tempo Médio de Resposta" value="14m" icon={Clock} trend="+2m" trendUp={false} />
          <StatCard title="Satisfação (CSAT)" value="4.8/5" icon={CheckCircle} trend="+0.2" trendUp={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Volume de Atendimentos (Últimos 7 dias)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Tickets por Canal</h3>
            <div className="h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full mt-4 space-y-2">
                {channelData.map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }}></div>
                      <span className="text-slate-600">{channel.name}</span>
                    </div>
                    <span className="font-medium text-slate-900">{channel.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
