import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MoreHorizontal, Plus, Car, Tag } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Deal {
    id: string;
    title: string;
    vehicle: string;
    value: number;
    contact: string;
}

interface ColumnData {
    id: string; // Database stage ID as string
    title: string;
    deals: Deal[];
}

export default function KanbanBoard({ initialStages }: { initialStages: any[] }) {
    const [columns, setColumns] = useState<ColumnData[]>([]);

    useEffect(() => {
        // Transform backend data into the format needed by the kanban board
        if (initialStages && initialStages.length > 0) {
            const formattedColumns = initialStages.map((stage: any) => ({
                id: stage.id.toString(),
                title: stage.name,
                deals: (stage.deals || []).map((deal: any) => ({
                    id: deal.id.toString(),
                    title: deal.title,
                    vehicle: deal.vehicle_model || 'Veículo não informado',
                    value: deal.value || 0,
                    contact: deal.contact?.name || 'Sem Contato'
                }))
            }));
            setColumns(formattedColumns);
        }
    }, [initialStages]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
        const destColIndex = columns.findIndex(col => col.id === destination.droppableId);

        const sourceCol = columns[sourceColIndex];
        const destCol = columns[destColIndex];

        const sourceDeals = [...sourceCol.deals];
        const destDeals = [...destCol.deals];

        const [movedDeal] = sourceDeals.splice(source.index, 1);

        // Optimistic UI update
        if (source.droppableId === destination.droppableId) {
            sourceDeals.splice(destination.index, 0, movedDeal);
            const newColumns = [...columns];
            newColumns[sourceColIndex] = { ...sourceCol, deals: sourceDeals };
            setColumns(newColumns);
        } else {
            destDeals.splice(destination.index, 0, movedDeal);
            const newColumns = [...columns];
            newColumns[sourceColIndex] = { ...sourceCol, deals: sourceDeals };
            newColumns[destColIndex] = { ...destCol, deals: destDeals };
            setColumns(newColumns);
            
            // Re-order in DB if moving between columns
            router.post(`/api/crm/deals/${draggableId}/move`, {
                crm_stage_id: destination.droppableId
            }, {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    // Revert on error
                    setColumns(columns);
                    alert("Erro ao mover negociação. Tentando novamente.");
                }
            });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (columns.length === 0) {
        return <div className="p-8 text-center text-gray-500">Nenhum estágio configurado neste funil.</div>;
    }

    return (
        <div className="flex h-full w-full gap-4 overflow-x-auto p-2 pb-6">
            <DragDropContext onDragEnd={onDragEnd}>
                {columns.map(column => (
                    <div key={column.id} className="flex h-full w-80 shrink-0 flex-col rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        {/* Column Header */}
                        <div className="flex items-center justify-between p-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {column.title}
                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    {column.deals.length}
                                </span>
                            </h3>
                            <div className="flex gap-1 text-gray-400">
                                <button title="Adicionar Negociação" aria-label="Adicionar Negociação" className="hover:text-gray-600 dark:hover:text-gray-200 p-1"><Plus className="h-4 w-4" /></button>
                                <button title="Opções da Coluna" aria-label="Opções da Coluna" className="hover:text-gray-600 dark:hover:text-gray-200 p-1"><MoreHorizontal className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {/* Drop Zone */}
                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto px-2 pb-2 transition-colors ${
                                        snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                    }`}
                                >
                                    {column.deals.map((deal, index) => (
                                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 transition-shadow ${
                                                        snapshot.isDragging ? 'shadow-lg ring-1 ring-indigo-500' : 'hover:border-indigo-300 dark:hover:border-indigo-500'
                                                    }`}
                                                >
                                                    <div className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                                        {deal.title}
                                                    </div>
                                                    <div className="mb-3 text-lg font-bold text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(deal.value)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                            <Car className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{deal.vehicle}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                                                            <span className="flex bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-medium items-center gap-1">
                                                                <Tag className="h-2.5 w-2.5"/> {deal.contact}
                                                            </span>
                                                            <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                                                {deal.contact.substring(0,2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    
                                    {/* Botão ADD Card fixo no fim da coluna */}
                                    <button className="flex w-full items-center gap-2 rounded-md border border-dashed border-gray-300 bg-transparent py-2 px-3 text-sm text-gray-500 hover:border-gray-400 hover:bg-white dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800 transition-colors mt-2">
                                        <Plus className="h-4 w-4" /> Add Cartão
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </DragDropContext>
        </div>
    );
}
