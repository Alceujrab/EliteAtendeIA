export type Channel = 'whatsapp' | 'email' | 'instagram' | 'phone' | 'facebook';
export type TicketStatus = 'open' | 'pending' | 'closed';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  image: string;
  features: string[];
  images?: string[];
  description?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  doors?: number;
  plate?: string;
}

export interface Message {
  id: string;
  sender: 'agent' | 'customer' | 'bot';
  text: string;
  timestamp: string;
  isVehicle?: boolean;
  vehicleData?: Vehicle;
  fromWebhook?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  agentName?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'lead';
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  tags?: string[];
}

export interface Ticket {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAvatar?: string;
  channel: Channel;
  status: TicketStatus;
  subject?: string;
  lastMessage: string;
  updatedAt: string;
  messages?: Message[];
  tags: string[];
  inbox?: string;
  assignedTo?: string;
  fromWebhook?: boolean;
}

export interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  value: number;
  status: string;
  type: 'sales' | 'sourcing' | 'post_sales';
  avatar?: string;
  lastEditedBy?: string;
  createdAt?: string;
  assignedTo?: string;
  postSalesData?: {
    documentationStatus?: string;
    deliveryDate?: string;
    insuranceOffered?: boolean;
    sevenDayCheckupDone?: boolean;
    customerBirthday?: string;
  };
  reminders?: {
    id: string;
    date: string;
    message: string;
    type: 'whatsapp' | 'internal';
    completed: boolean;
  }[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  avatar: string;
  inboxes: string[];
}
