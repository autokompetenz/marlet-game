import { create } from 'zustand';
import api from '../services/api';

export const useAuth = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  login: async (username, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  register: async (username, phone, password) => {
    const { data } = await api.post('/auth/register', { username, phone, password });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },
}));

export const useWallet = create((set) => ({
  balance: 0,
  transactions: [],
  fetchBalance: async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      set({ balance: data.balance });
    } catch {}
  },
  fetchTransactions: async () => {
    try {
      const { data } = await api.get('/wallet/transactions');
      set({ transactions: data });
    } catch {}
  },
  deposit: async (amount) => {
    const { data } = await api.post('/wallet/deposit', { amount });
    return data;
  },
  confirmDeposit: async (reference) => {
    await api.post('/wallet/deposit/confirm', { reference });
    await set(async (s) => ({ ...s }));
  },
  withdraw: async (amount) => {
    const { data } = await api.post('/wallet/withdraw', { amount });
    return data;
  },
}));

export const useGames = create((set) => ({
  games: [],
  history: [],
  fetchGames: async () => {
    const { data } = await api.get('/games/games');
    set({ games: data });
  },
  fetchHistory: async () => {
    const { data } = await api.get('/games/history');
    set({ history: data });
  },
  playDice: (amount, prediction) => api.post('/games/dice', { amount, prediction }),
  playSlots: (amount) => api.post('/games/slots', { amount }),
  playRoulette: (amount, bets) => api.post('/games/roulette', { amount, bets }),
  playBlackjack: (amount) => api.post('/games/blackjack', { amount }),
}));
