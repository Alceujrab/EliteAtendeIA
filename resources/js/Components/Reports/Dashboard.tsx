import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

const dataAtendimentos = [
    { name: 'Seg', whatsapp: 120, instagram: 45, site: 20 },
    { name: 'Ter', whatsapp: 132, instagram: 50, site: 25 },
    { name: 'Qua', whatsapp: 101, instagram: 40, site: 15 },
    { name: 'Qui', whatsapp: 140, instagram: 60, site: 30 },
    { name: 'Sex', whatsapp: 190, instagram: 80, site: 45 },
    { name: 'Sáb', whatsapp: 210, instagram: 100, site: 50 },
    { name: 'Dom', whatsapp: 90, instagram: 30, site: 10 },
];

const dataSLA = [
    { name: '10:00', tempo_espera: 2.5 },
    { name: '12:00', tempo_espera: 4.0 },
    { name: '14:00', tempo_espera: 5.5 },
    { name: '16:00', tempo_espera: 3.0 },
    { name: '18:00', tempo_espera: 1.5 },
];

export default function ReportsDashboard() {
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full overflow-y-auto w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visão Geral Corporativa</h1>
                <div className="flex gap-2">
                    <select title="Período" aria-label="Período" className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-md shadow-sm focus:ring-indigo-500">
                        <option>Últimos 7 dias</option>
                        <option>Este Mês</option>
                        <option>Últimos 30 dias</option>
                    </select>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Novos Leads" value="842" percent="+12.5%" icon={<Users className="h-5 w-5 text-indigo-600" />} color="bg-indigo-50" />
                    <KpiCard title="Atendimentos" value="1,240" percent="+5.2%" icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
                    <KpiCard title="Tempo Médio Resp." value="4m 30s" percent="-1.5%" icon={<Clock className="h-5 w-5 text-amber-600" />} color="bg-amber-50" negative />
                    <KpiCard title="Taxa de Conversão" value="8.4%" percent="+2.1%" icon={<CheckCircle className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico 1 - BarChart */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Volume por Canal</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataAtendimentos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="whatsapp" name="WhatsApp" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="instagram" name="Instagram" stackId="a" fill="#F43F5E" />
                                    <Bar dataKey="site" name="Web Chat" stackId="a" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gráfico 2 - LineChart */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Tempo Médio de Espera (SLA)</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dataSLA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="tempo_espera" name="Tempo (minutos)" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, percent, icon, color, negative = false }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
                <div className={`p-2 rounded-lg ${color} dark:bg-opacity-20`}>{icon}</div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                <span className={`text-sm font-medium mb-1 ${negative ? 'text-red-500' : 'text-emerald-500'}`}>
                    {percent}
                </span>
            </div>
        </div>
    );
}
