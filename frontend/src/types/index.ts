/* Types for ClauseForge Legal Document Analysis Platform */

// ──── User & Auth ────
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'user' | 'admin' | 'moderator' | 'support';
    status?: 'active' | 'suspended' | 'blocked';
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

// ──── Documents ────
export interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    status: 'pending' | 'analyzing' | 'completed' | 'error';
    riskScore?: number;
    riskLevel?: RiskLevel;
    content?: string;
    clauses?: Clause[];
}

export type RiskLevel = 'low' | 'medium' | 'high';

// ──── Clauses ────
export interface Clause {
    id: string;
    text: string;
    type: ClauseType;
    riskLevel: RiskLevel;
    startIndex: number;
    endIndex: number;
    explanation: string;
    confidence: number;
    riskConfidence: number;
}

export type ClauseType =
    | 'Confidentiality'
    | 'Terminations'
    | 'Payments'
    | 'Indemnifications'
    | 'Governing Laws'
    | 'Intellectual Property'
    | 'Arbitration'
    | 'Warranties'
    | 'Assigns'
    | 'Amendments'
    | 'Notices'
    | 'Representations'
    | 'Compliance With Laws'
    | string;

// ──── Risk ────
export interface RiskItem {
    id: string;
    category: string;
    description: string;
    severity: RiskLevel;
    recommendation: string;
}

export interface AnalysisResult {
    documentId: string;
    overallRiskScore: number;
    riskLevel: RiskLevel;
    clauses: Clause[];
    risks: RiskItem[];
    summary: string;
    analyzedAt: string;
}

// ──── Comparison ────
export interface DiffSegment {
    text: string;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface ClauseComparison {
    clause_type: string;
    text_a: string;
    text_b: string;
    relationship: 'similar' | 'conflicting' | 'unrelated';
    confidence: number;
    explanation: string;
}

export interface ComparisonResult {
    documentA: { id: string; name: string };
    documentB: { id: string; name: string };
    diffA: DiffSegment[];
    diffB: DiffSegment[];
    similarity: number;
    changes: number;
    summary?: string;
    clauseComparisons?: ClauseComparison[];
}

// ──── Chat ────
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

// ──── Report ────
export interface Report {
    documentId: string;
    documentName: string;
    fullAiReport: string | null;
    clauseAnalysis: {
        type: ClauseType;
        count: number;
        riskBreakdown: Record<RiskLevel, number>;
    }[];
    riskInsights: string[];
    generatedAt: string;
}

// ──── Dashboard Stats ────
export interface DashboardStats {
    totalDocuments: number;
    averageRiskScore: number;
    highRiskDocuments: number;
    riskDistribution: { name: string; value: number; color: string }[];
    clauseDistribution: { name: string; count: number }[];
}

// ══════════════════════════════════════
// ADMIN TYPES
// ══════════════════════════════════════

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'moderator' | 'support';
    status: 'active' | 'suspended' | 'blocked';
    lastLoginAt: string | null;
    lastIpAddress: string | null;
    loginCount: number;
    failedLoginAttempts: number;
    suspendedReason: string | null;
    documentCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface AdminDocument {
    _id: string;
    name: string;
    type: string;
    size: number;
    status: 'pending' | 'analyzing' | 'completed' | 'failed';
    riskLevel: RiskLevel | null;
    overallRiskScore: number | null;
    user: { _id: string; name: string; email: string; role: string } | null;
    createdAt: string;
    updatedAt: string;
}

export interface AuditLogEntry {
    _id: string;
    user: { _id: string; name: string; email: string; role: string } | null;
    adminUser: { _id: string; name: string; email: string } | null;
    action: string;
    resource: string;
    ipAddress: string;
    details: Record<string, any>;
    createdAt: string;
}

export interface BlockedIP {
    ip: string;
    reason: string;
    blockedAt: string | null;
    blockedBy?: string;
}

export interface AnalyticsOverview {
    totalUsers: number;
    totalDocuments: number;
    totalStorageBytes: number;
    recentLogins: number;
    usersByRole: Record<string, number>;
    docsByStatus: Record<string, number>;
    docsByRisk: Record<string, number>;
}

export interface ActivityDataPoint {
    _id: string; // date string YYYY-MM-DD
    count: number;
}

export interface SystemHealth {
    mongodb: { connected: boolean; readyState: number };
    redis: { connected: boolean; pingMs: number | null };
    queue: { depth: number };
    aiService: { healthy: boolean };
    server: {
        uptime: number;
        nodeVersion: string;
        platform: string;
        memoryMB: number;
    };
    checkedAt: string;
}

export interface RedisStats {
    usedMemory: string;
    usedMemoryPeak: string;
    connectedClients: number;
    totalCommandsProcessed: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    totalKeys: number;
    uptimeSeconds: number;
    redisVersion: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pages: number;
}
