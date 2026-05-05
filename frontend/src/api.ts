import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
});

export const setupWallet = async (name: string, balance: number) => {
  const response = await api.post('/setup', { name, balance });
  return response.data;
};

export const getWallet = async (id: string) => {
  const response = await api.get(`/wallet/${id}`);
  return response.data;
};

export const transact = async (walletId: string, amount: number, description: string) => {
  const response = await api.post(`/transact/${walletId}`, { amount, description });
  return response.data;
};

export const getTransactions = async (walletId: string, skip: number, limit: number) => {
  const response = await api.get(`/transactions`, {
    params: { walletId, skip, limit }
  });
  return response.data;
};
