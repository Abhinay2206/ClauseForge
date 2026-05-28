import api from './api';

export const createTicket = async (data: any) => {
    const response = await api.post('/api/support/tickets', data);
    return response.data;
};

export const getMyTickets = async () => {
    const response = await api.get('/api/support/tickets/my');
    return response.data;
};

export const getAllTickets = async (params: any = {}) => {
    const response = await api.get('/api/support/tickets', { params });
    return response.data;
};

export const getTicketById = async (id: string) => {
    const response = await api.get(`/api/support/tickets/${id}`);
    return response.data; // { ticket, messages }
};

export const replyToTicket = async (id: string, content: string, isInternalNote = false) => {
    const response = await api.post(`/api/support/tickets/${id}/reply`, { content, isInternalNote });
    return response.data;
};

export const updateTicket = async (id: string, updates: any) => {
    const response = await api.put(`/api/support/tickets/${id}`, updates);
    return response.data;
};

export const getKnowledgeArticles = async (category?: string, search?: string) => {
    const params: any = {};
    if (category) params.category = category;
    if (search) params.search = search;
    const response = await api.get('/api/support/kb', { params });
    return response.data;
};

export const draftTicketReply = async (id: string) => {
    const response = await api.post(`/api/support/tickets/${id}/draft`);
    return response.data.draft;
};
