import { Ticket, Vehicle, Lead, AppUser } from './types';

export const mockVehicles: Vehicle[] = [
  {
    id: 'V001',
    brand: 'Honda',
    model: 'Civic Touring 1.5 Turbo',
    year: 2023,
    price: 175900,
    mileage: 12000,
    image: 'https://images.unsplash.com/photo-1606016159991-d17f65320c87?auto=format&fit=crop&q=80&w=400',
    features: ['Teto Solar', 'Bancos em Couro', 'Apple CarPlay']
  },
  {
    id: 'V002',
    brand: 'Jeep',
    model: 'Compass Longitude',
    year: 2022,
    price: 158000,
    mileage: 25000,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400',
    features: ['Multimídia 10"', 'Sensor de Ponto Cego', '4x4']
  },
  {
    id: 'V003',
    brand: 'Toyota',
    model: 'Corolla Altis Hybrid',
    year: 2024,
    price: 192500,
    mileage: 0,
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80&w=400',
    features: ['Híbrido', 'Piloto Automático Adaptativo', 'Faróis Full LED']
  }
];

export const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    customerName: 'Ana Silva',
    customerEmail: 'ana.silva@email.com',
    customerPhone: '+55 11 99999-1111',
    customerAvatar: 'https://i.pravatar.cc/150?u=ana',
    channel: 'whatsapp',
    status: 'open',
    lastMessage: 'Gostaria de ver as fotos do Civic.',
    updatedAt: '10:30 AM',
    tags: ['Vendas', 'Interesse Civic'],
    inbox: 'default',
    messages: [
      { id: 'm1', sender: 'bot', text: 'Olá! Bem-vindo à EliteMotors. Sou o assistente virtual. Como posso ajudar?', timestamp: '10:28 AM' },
      { id: 'm2', sender: 'customer', text: 'Gostaria de ver as fotos do Civic.', timestamp: '10:30 AM' }
    ]
  },
  {
    id: 'TKT-002',
    customerName: 'Carlos Oliveira',
    customerPhone: '+55 11 98888-2222',
    channel: 'instagram',
    status: 'pending',
    lastMessage: 'Vocês aceitam meu carro na troca?',
    updatedAt: 'Ontem',
    tags: ['Captação', 'Avaliação'],
    inbox: 'default',
    messages: [
      { id: 'm1', sender: 'customer', text: 'Vi o Compass no Instagram. Vocês aceitam meu carro na troca? Tenho um HR-V 2019.', timestamp: 'Ontem, 14:00' }
    ]
  },
  {
    id: 'TKT-003',
    customerName: 'Fernanda Costa',
    customerPhone: '+55 11 97777-3333',
    channel: 'facebook',
    status: 'open',
    lastMessage: 'Onde fica a loja de vocês?',
    updatedAt: '09:15 AM',
    tags: ['Dúvida', 'Localização'],
    inbox: 'default',
    messages: [
      { id: 'm1', sender: 'customer', text: 'Bom dia! Onde fica a loja de vocês?', timestamp: '09:15 AM' }
    ]
  }
];

export const mockLeads: Lead[] = [
  { id: 'L001', customerName: 'Ana Silva', customerPhone: '+55 11 99999-1111', vehicleName: 'Honda Civic Touring', value: 175900, status: 'negotiation', type: 'sales', avatar: 'https://i.pravatar.cc/150?u=ana', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), lastEditedBy: 'Roberto Admin', assignedTo: 'U001' },
  { id: 'L002', customerName: 'Marcos Paulo', customerPhone: '+55 11 97777-7777', vehicleName: 'Jeep Compass', value: 158000, status: 'credit', type: 'sales', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), lastEditedBy: 'Carla Gerente', assignedTo: 'U002' },
  { id: 'L003', customerName: 'Carlos Oliveira', customerPhone: '+55 11 98888-2222', vehicleName: 'Honda HR-V 2019 (Troca)', value: 95000, status: 'evaluation', type: 'sourcing', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), lastEditedBy: 'João Agente', assignedTo: 'U003' },
  { id: 'L004', customerName: 'Julia Santos', customerPhone: '+55 11 96666-6666', vehicleName: 'Toyota Corolla', value: 192500, status: 'won', type: 'sales', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), lastEditedBy: 'Roberto Admin', assignedTo: 'U001' },
  { id: 'L005', customerName: 'Pedro Costa', customerPhone: '+55 11 95555-5555', vehicleName: 'Volkswagen Nivus', value: 135000, status: 'delivery', type: 'post_sales', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), lastEditedBy: 'Carla Gerente', assignedTo: 'U002', postSalesData: { documentationStatus: 'Pendente', deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), insuranceOffered: false, sevenDayCheckupDone: false } },
];

export const mockUsers: AppUser[] = [
  { id: 'U001', name: 'Roberto Admin', email: 'roberto@elitecrm.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=rob', inboxes: ['Todas'] },
  { id: 'U002', name: 'Carla Gerente', email: 'carla@elitecrm.com', role: 'manager', avatar: 'https://i.pravatar.cc/150?u=carla', inboxes: ['Vendas', 'Captação'] },
  { id: 'U003', name: 'João Agente', email: 'joao@elitecrm.com', role: 'agent', avatar: 'https://i.pravatar.cc/150?u=agent', inboxes: ['WhatsApp Vendas'] },
];
