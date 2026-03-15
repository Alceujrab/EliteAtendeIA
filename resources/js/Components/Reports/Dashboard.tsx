import { useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

type PeriodValue = '7' | '30' | '60';

interface ReportsPayload {
    success: boolean;
    kpis: {
        newLeads: number;
        attendances: number;
        avgHandleMinutes: number;
        conversionRate: number;
    };
    volumeByChannel: Array<{
        name: string;
        whatsapp: number;
        instagram: number;
        webchat: number;
    }>;
    avgHandleByDay: Array<{
        name: string;
        avg_minutes: number;
    }>;
}

const defaultData: ReportsPayload = {
    success: true,
    kpis: {
        newLeads: 0,
        attendances: 0,
        avgHandleMinutes: 0,
        conversionRate: 0,
    },
    volumeByChannel: [],
    avgHandleByDay: [],
};

export default function ReportsDashboard() {
    const [period, setPeriod] = useState<PeriodValue>('7');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ReportsPayload>(defaultData);

    useEffect(() => {
        let ignore = false;

        const loadReports = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get<ReportsPayload>('/api/reports/overview', {
                    params: { days: Number(period) },
                });

                if (!ignore) {
                    setData(response.data);
                }
            } catch (err: any) {
                if (!ignore) {
                    setError('Nao foi possivel carregar os dados de relatorios.');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadReports();

        return () => {
            ignore = true;
        };
    }, [period]);

    const periodLabel = useMemo(() => {
        if (period === '30') return 'Ultimos 30 dias';
        if (period === '60') return 'Ultimos 60 dias';
        return 'Ultimos 7 dias';
    }, [period]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visão Geral Corporativa</h1>
                <div className="flex gap-2">
                    <select
                        title="Periodo"
                        aria-label="Periodo"
                        value={period}
                        onChange={(event) => setPeriod(event.target.value as PeriodValue)}
                        className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-md shadow-sm focus:ring-indigo-500"
                    >
                        <option value="7">Ultimos 7 dias</option>
                        <option value="30">Ultimos 30 dias</option>
                        <option value="60">Ultimos 60 dias</option>
                    </select>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Novos Leads" value={String(data.kpis.newLeads)} subtitle={periodLabel} icon={<Users className="h-5 w-5 text-indigo-600" />} color="bg-indigo-50" />
                    <KpiCard title="Atendimentos" value={String(data.kpis.attendances)} subtitle={periodLabel} icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
                    <KpiCard title="Tempo Medio" value={`${data.kpis.avgHandleMinutes.toFixed(1)} min`} subtitle="Atendimento" icon={<Clock className="h-5 w-5 text-amber-600" />} color="bg-amber-50" />
                    <KpiCard title="Taxa Conversao" value={`${data.kpis.conversionRate.toFixed(1)}%`} subtitle="Deals ganhos" icon={<CheckCircle className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico 1 - BarChart */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Volume por Canal</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.volumeByChannel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="whatsapp" name="WhatsApp" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="instagram" name="Instagram" stackId="a" fill="#F43F5E" />
                                    <Bar dataKey="webchat" name="Web Chat" stackId="a" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gráfico 2 - LineChart */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Tempo Medio por Dia</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.avgHandleByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="avg_minutes" name="Minutos" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Atualizando relatorios...</div>
                )}
            </div>
        </div>
    );
}

function KpiCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle: string; icon: ReactNode; color: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
                <div className={`p-2 rounded-lg ${color} dark:bg-opacity-20`}>{icon}</div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                <span className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
                    {subtitle}
                </span>
            </div>
        </div>
    );
}
