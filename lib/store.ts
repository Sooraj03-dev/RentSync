import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'landlord' | 'tenant' | null;

interface AppState {
  role: Role;
  activeTenancyId: string | null;
  pendingInviteId: string | null;
  totalUnread: number;
  setRole: (role: Role) => void;
  setActiveTenancy: (id: string | null) => void;
  setPendingInvite: (id: string | null) => void;
  setTotalUnread: (n: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      role: null,
      activeTenancyId: null,
      pendingInviteId: null,
      totalUnread: 0,
      setRole: (role) => set({ role }),
      setActiveTenancy: (id) => set({ activeTenancyId: id }),
      setPendingInvite: (id) => set({ pendingInviteId: id }),
      setTotalUnread: (n) => set({ totalUnread: n }),
    }),
    { name: 'rentsync-store' }
  )
);
