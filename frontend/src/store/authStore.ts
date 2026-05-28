import { create } from 'zustand';
import api from '@/services/api';
import type { User } from '@/types';

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

/**
 * Auth store - connects to backend API.
 * Uses HTTP-only cookies for token, stores user in localStorage for persistence.
 */
export const useAuthStore = create<AuthStore>((set) => ({
    user: JSON.parse(localStorage.getItem('clauseforge_user') || 'null'),
    isAuthenticated: !!localStorage.getItem('clauseforge_user'),

    login: async (email: string, password: string) => {
        try {
            const { data } = await api.post('/api/auth/login', { email, password });
            
            const user: User = {
                id: data._id,
                name: data.name,
                email: data.email,
                role: data.role || 'user',
                status: data.status || 'active',
            };

            localStorage.setItem('clauseforge_user', JSON.stringify(user));
            
            set({ user, isAuthenticated: true });
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    signup: async (name: string, email: string, password: string) => {
        try {
            const { data } = await api.post('/api/auth/register', { name, email, password });
            
            const user: User = { 
                id: data._id, 
                name: data.name, 
                email: data.email, 
                role: data.role || 'user',
                status: data.status || 'active',
            };

            localStorage.setItem('clauseforge_user', JSON.stringify(user));
            
            set({ user, isAuthenticated: true });
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Signup failed');
        }
    },

    logout: async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('clauseforge_user');
            set({ user: null, isAuthenticated: false });
        }
    },
}));
