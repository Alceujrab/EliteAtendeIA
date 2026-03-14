import React, { useCallback, useState, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    MiniMap,
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    Handle,
    Position,
    ReactFlowProvider,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MessageSquare, ListTree, Save, Play, Bot, ArrowRight, X } from 'lucide-react';

const CustomMessageNode = ({ data, id }: any) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-500 shadow-lg w-64">
            <div className="bg-indigo-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <MessageSquare className="h-4 w-4" /> Mensagem
                </div>
                <button 
                    onClick={() => data.onDelete(id)}
                    title="Excluir Nó" 
                    aria-label="Excluir Nó" 
                    className="hover:bg-indigo-600 rounded p-0.5"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
            <div className="p-3 text-sm text-gray-700 dark:text-gray-300">
                <textarea 
                    title="Texto da Mensagem" 
                    aria-label="Texto da Mensagem" 
                    className="w-full text-sm rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-2 resize-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]" 
                    defaultValue={data.text} 
                />
            </div>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
        </div>
    );
};

const CustomMenuNode = ({ data, id }: any) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-500 shadow-lg w-64">
            <div className="bg-emerald-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <ListTree className="h-4 w-4" /> Menu de Opções
                </div>
                <button 
                    onClick={() => data.onDelete(id)}
                    title="Excluir Nó" 
                    aria-label="Excluir Nó" 
                    className="hover:bg-emerald-600 rounded p-0.5"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Texto do Menu:</p>
                <input type="text" title="Título do Menu" aria-label="Título do Menu" className="w-full text-sm rounded border-gray-200 dark:border-gray-700 p-1" defaultValue={data.text} />
            </div>
            <div className="p-2 space-y-2">
                {(data.options || []).map((opt: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm">
                        <span>{opt.label}</span>
                        <Handle type="source" position={Position.Right} id={`opt-${i}`} className="w-3 h-3 bg-emerald-500 relative transform translate-x-3" />
                    </div>
                ))}
                <button 
                    onClick={() => data.onAddOption(id)}
                    className="w-full text-xs text-emerald-600 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 rounded py-1 font-medium mt-1 hover:bg-emerald-100 transition-colors"
                >
                    + Adicionar Opção
                </button>
            </div>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-500" />
        </div>
    );
};

const nodeTypes = {
    messageNode: CustomMessageNode,
    menuNode: CustomMenuNode,
};

let idGenerator = 4;
const getId = () => `${idGenerator++}`;

function FlowBuilder() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    }, []);

    const addOptionToMenu = useCallback((id: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const newOptions = [...(node.data.options as any[]), { id: `opt${Date.now()}`, label: 'Nova Opção' }];
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            options: newOptions,
                        },
                    };
                }
                return node;
            })
        );
    }, []);

    const initialNodes: Node[] = [
        {
            id: 'start',
            position: { x: 250, y: 50 },
            data: { label: 'Início do Chat' },
            type: 'input',
            style: { background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }
        },
        {
            id: '1',
            type: 'messageNode',
            position: { x: 250, y: 150 },
            data: { text: 'Olá! Bem-vindo à Elite Veículos. Como posso te ajudar hoje?', onDelete: deleteNode },
        },
        {
            id: '2',
            type: 'menuNode',
            position: { x: 250, y: 350 },
            data: { 
                text: 'Selecione uma opção:',
                options: [
                    { id: 'opt1', label: '1. Comprar Veículo' },
                    { id: 'opt2', label: '2. Vender meu Carro' },
                    { id: 'opt3', label: '3. Falar com Atendente' }
                ],
                onDelete: deleteNode,
                onAddOption: addOptionToMenu
            },
        },
        {
            id: '3',
            type: 'messageNode',
            position: { x: 550, y: 350 },
            data: { text: 'Ótimo! Vou te transferir para um de nossos corretores especialistas.', onDelete: deleteNode },
        }
    ];

    const initialEdges: Edge[] = [
        { id: 'e-start-1', source: 'start', target: '1', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
        { id: 'e-1-2', source: '1', target: '2', type: 'smoothstep', style: { stroke: '#a855f7', strokeWidth: 2 } },
        { id: 'e-2-3', source: '2', sourceHandle: 'opt-2', target: '3', type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        []
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode: Node = {
                id: getId(),
                type,
                position,
                data: { 
                    text: type === 'messageNode' ? 'Nova mensagem' : 'Novo menu',
                    options: type === 'menuNode' ? [{ id: 'opt1', label: 'Opção 1' }] : undefined,
                    onDelete: deleteNode,
                    onAddOption: type === 'menuNode' ? addOptionToMenu : undefined
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, deleteNode, addOptionToMenu]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="flex h-full w-full bg-slate-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
            {/* Sidebar Tools */}
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col shrink-0 z-10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Blocos</h3>
                
                <div className="space-y-3 flex-1">
                    <div 
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-3 cursor-grab hover:border-indigo-500 hover:shadow-sm bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all"
                        onDragStart={(event) => onDragStart(event, 'messageNode')}
                        draggable
                    >
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                        Mensagem Simples
                    </div>
                    <div 
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-3 cursor-grab hover:border-emerald-500 hover:shadow-sm bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all"
                        onDragStart={(event) => onDragStart(event, 'menuNode')}
                        draggable
                    >
                        <ListTree className="h-5 w-5 text-emerald-500" />
                        Menu Dinâmico
                    </div>
                    {/* Add more node types later when implementing logics */}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-3 cursor-grab hover:border-blue-500 hover:shadow-sm bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all opacity-50">
                        <ArrowRight className="h-5 w-5 text-blue-500" />
                        Transferir
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-3 cursor-grab hover:border-purple-500 hover:shadow-sm bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all opacity-50">
                        <Bot className="h-5 w-5 text-purple-500" />
                        Gatilho IA
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto space-y-2">
                    <button className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">
                        <Save className="h-4 w-4" /> Salvar Fluxo
                    </button>
                    <button className="w-full flex justify-center items-center gap-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Play className="h-4 w-4 text-emerald-500" /> Testar Chatbot
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-gray-50 dark:bg-gray-900"
                >
                    <Background color="#9CA3AF" gap={16} />
                    <Controls className="fill-gray-600 dark:fill-gray-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md" />
                    <MiniMap className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" maskColor="rgba(0,0,0,0.1)" />
                </ReactFlow>
            </div>
        </div>
    );
}

export default function ChatbotBuilder() {
    return (
        <ReactFlowProvider>
            <FlowBuilder />
        </ReactFlowProvider>
    );
}
