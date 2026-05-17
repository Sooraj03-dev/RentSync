export interface Conversation {
  id: string;
  tenancy_id: string;
  landlord_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_avatar?: string;
  property_name: string;
  unit_number: string;
  last_message?: string;
  last_message_at?: string;
  landlord_unread: number;
  tenant_unread: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'landlord' | 'tenant' | 'system';
  body: string;
  msg_type: 'text' | 'image' | 'document' | 'system';
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: string;
}
