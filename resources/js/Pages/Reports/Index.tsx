import KinboxLayout from '@/Layouts/KinboxLayout';
import { Head } from '@inertiajs/react';
import ReportsDashboard from '@/Components/Reports/Dashboard';

export default function ReportsIndex() {
    return (
        <KinboxLayout
            sidebar={
                <div className="p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Métricas</h2>
                    <ul className="space-y-2">
                        <li className="text-sm font-medium text-indigo-600 bg-indigo-50 p-2 rounded-md cursor-pointer">Visão Geral</li>
                        <li className="text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 p-2 rounded-md cursor-pointer">Atribuição</li>
                    </ul>
                </div>
            }
        >
            <Head title="Relatórios Analíticos" />
            <ReportsDashboard />
        </KinboxLayout>
    );
}
