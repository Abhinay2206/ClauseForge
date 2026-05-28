import axios from 'axios';

/**
 * Axios instance for ClauseForge API.
 * In production, set VITE_API_URL in .env.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('clauseforge_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
