import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'landlord' | 'tenant' | null;

interface AppState {
  role: Role;
  activeTenancyId: string | null;
  setRole: (role: Role) => void;
  setActiveTenancy: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      role: null,
      activeTenancyId: null,
      setRole: (role) => set({ role }),
      setActiveTenancy: (id) => set({ activeTenancyId: id }),
    }),
    { name: 'rentsync-store' }
  )
);
