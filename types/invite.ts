export interface PropertyInvite {
  id: string;
  property_id: string;
  unit_number: string;
  code: string;
  landlord_id: string;
  assigned_email?: string;
  rent_amount: number;
  due_day: number;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  accepted_at?: string;
  tenant_id?: string;
  tenant_name?: string;
  created_at: string;
}
