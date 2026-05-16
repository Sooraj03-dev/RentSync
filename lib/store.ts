import { create } from 'zustand';

type Role = 'landlord' | 'tenant' | null;

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useStore = create<AppState>((set) => ({
  role: 'landlord', // Default for demonstration
  setRole: (role) => set({ role }),
}));
