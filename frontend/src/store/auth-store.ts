import { create } from 'zustand';
import type { Actor } from '@/api/types';

interface AuthState {
  actor: Actor | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (token: string, actor: Actor) => void;
  hydrate: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  actor: null,
  token: null,
  isHydrated: false,

  setAuth: (token, actor) => {
    localStorage.setItem('daylog_token', token);
    localStorage.setItem('daylog_actor', JSON.stringify(actor));
    set({ token, actor, isHydrated: true });
  },

  hydrate: () => {
    const token = localStorage.getItem('daylog_token');
    const raw = localStorage.getItem('daylog_actor');
    let actor: Actor | null = null;
    try {
      actor = raw ? (JSON.parse(raw) as Actor) : null;
    } catch {
      actor = null;
    }
    set({ token, actor, isHydrated: true });
  },

  logout: () => {
    localStorage.removeItem('daylog_token');
    localStorage.removeItem('daylog_actor');
    set({ token: null, actor: null });
  },
}));
