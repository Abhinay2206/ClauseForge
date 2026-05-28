import api from '@/services/api';
import type {
    AdminUser,
    AdminDocument,
    AuditLogEntry,
    BlockedIP,
    AnalyticsOverview,
    ActivityDataPoint,
    SystemHealth,
    RedisStats,
    DLQJob,
} from '@/types';

// ──── Users ────────────────────────────────────────────────────────────────

export interface GetUsersParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    pages: number;
}

export const getUsers = async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
    const { data } = await api.get('/api/admin/users', { params });
    return data;
};

export const getUserById = async (id: string) => {
    const { data } = await api.get(`/api/admin/users/${id}`);
    return data as { user: AdminUser; documents: AdminDocument[]; auditLogs: AuditLogEntry[] };
};

export const updateUserStatus = async (id: string, status: 'active' | 'suspended' | 'blocked', reason?: string) => {
    const { data } = await api.patch(`/api/admin/users/${id}/status`, { status, reason });
    return data;
};

export const updateUserRole = async (id: string, role: string) => {
    const { data } = await api.patch(`/api/admin/users/${id}/role`, { role });
    return data;
};

export const deleteUser = async (id: string) => {
    const { data } = await api.delete(`/api/admin/users/${id}`);
    return data;
};

// ──── Documents ────────────────────────────────────────────────────────────

export interface GetDocumentsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    riskLevel?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetDocumentsResponse {
    documents: AdminDocument[];
    total: number;
    page: number;
    pages: number;
    totalStorage: number;
}

export const getAllDocuments = async (params: GetDocumentsParams = {}): Promise<GetDocumentsResponse> => {
    const { data } = await api.get('/api/admin/documents', { params });
    return data;
};

export const adminDeleteDocument = async (id: string) => {
    const { data } = await api.delete(`/api/admin/documents/${id}`);
    return data;
};

// ──── Audit Logs ───────────────────────────────────────────────────────────

export interface GetAuditLogsParams {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
}

export interface GetAuditLogsResponse {
    logs: AuditLogEntry[];
    total: number;
    page: number;
    pages: number;
}

export const getAuditLogs = async (params: GetAuditLogsParams = {}): Promise<GetAuditLogsResponse> => {
    const { data } = await api.get('/api/admin/audit-logs', { params });
    return data;
};

// ──── Analytics ────────────────────────────────────────────────────────────

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
    const { data } = await api.get('/api/admin/analytics/overview');
    return data;
};

export const getActivityTimeseries = async (): Promise<{ uploads: ActivityDataPoint[]; logins: ActivityDataPoint[] }> => {
    const { data } = await api.get('/api/admin/analytics/activity');
    return data;
};

export const getRiskAnalytics = async () => {
    const { data } = await api.get('/api/admin/analytics/risk');
    return data as {
        riskDist: { _id: string; count: number; avgScore: number }[];
        clauseTypes: { _id: string; count: number }[];
        topUsers: { _id: string; count: number; name: string; email: string }[];
    };
};

// ──── IP Management ────────────────────────────────────────────────────────

export const getBlockedIPs = async (): Promise<{ blocked: BlockedIP[] }> => {
    const { data } = await api.get('/api/admin/ip/blocked');
    return data;
};

export const blockIP = async (ip: string, reason: string) => {
    const { data } = await api.post('/api/admin/ip/block', { ip, reason });
    return data;
};

export const unblockIP = async (ip: string) => {
    const { data } = await api.delete(`/api/admin/ip/unblock/${encodeURIComponent(ip)}`);
    return data;
};

// ──── System Health ────────────────────────────────────────────────────────

export const getSystemHealth = async (): Promise<SystemHealth> => {
    const { data } = await api.get('/api/admin/system/health');
    return data;
};

export const getRedisStats = async (): Promise<RedisStats> => {
    const { data } = await api.get('/api/admin/system/redis-stats');
    return data;
};

export const getDLQJobs = async (): Promise<{ jobs: DLQJob[] }> => {
    const { data } = await api.get('/api/admin/system/dlq');
    return data;
};
