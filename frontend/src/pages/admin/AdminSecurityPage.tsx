import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Shield, Globe, Ban, Unlock, Plus, X, RefreshCw,
    Activity, Search, Clock, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import * as adminService from '@/services/adminService';
import type { AuditLogEntry, BlockedIP } from '@/types';
import { cn } from '@/utils/helpers';

const AUDIT_ACTION_COLORS: Record<string, { color: string; bg: string }> = {
    login:              { color: '#059669', bg: '#D1FAE5' },
    signup:             { color: '#2563EB', bg: '#DBEAFE' },
    logout:             { color: '#64748B', bg: '#F1F5F9' },
    document_upload:    { color: '#7C3AED', bg: '#EDE9FE' },
    document_delete:    { color: '#DC2626', bg: '#FEE2E2' },
    user_block:         { color: '#D97706', bg: '#FEF3C7' },
    user_suspend:       { color: '#EA580C', bg: '#FFEDD5' },
    user_restore:       { color: '#059669', bg: '#D1FAE5' },
    ip_block:           { color: '#DC2626', bg: '#FEE2E2' },
    ip_unblock:         { color: '#059669', bg: '#D1FAE5' },
    report_download:    { color: '#2563EB', bg: '#DBEAFE' },
    document_admin_delete: { color: '#DC2626', bg: '#FEE2E2' },
    user_delete:        { color: '#DC2626', bg: '#FEE2E2' },
    default:            { color: '#64748B', bg: '#F1F5F9' },
};

// ── IP Block Manager ────────────────────────────────────────────────────────
function IPBlockManager() {
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [newIP, setNewIP] = useState('');
    const [newReason, setNewReason] = useState('');
    const [adding, setAdding] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [unblocking, setUnblocking] = useState<string | null>(null);

    const loadIPs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getBlockedIPs();
            setBlockedIPs(res.blocked);
        } catch {}
        setLoading(false);
    }, []);

    useEffect(() => { loadIPs(); }, [loadIPs]);

    const handleBlock = async () => {
        if (!newIP.trim()) return;
        setAdding(true);
        try {
            await adminService.blockIP(newIP.trim(), newReason || 'Manual admin block');
            setNewIP('');
            setNewReason('');
            setShowForm(false);
            loadIPs();
        } catch {}
        setAdding(false);
    };

    const handleUnblock = async (ip: string) => {
        setUnblocking(ip);
        try {
            await adminService.unblockIP(ip);
            loadIPs();
        } catch {}
        setUnblocking(null);
    };

    return (
        <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-[#2563EB]" />
                    <span className="text-[13px] font-bold text-[#0F172A]">Blocked IP Addresses</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: blockedIPs.length > 0 ? '#FEE2E2' : '#F1F5F9', color: blockedIPs.length > 0 ? '#DC2626' : '#64748B' }}>
                        {blockedIPs.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadIPs} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors">
                        <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} />
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                        className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-bold transition-all border shadow-sm',
                            showForm ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2]' : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE]'
                        )}>
                        {showForm ? <X size={13} /> : <Plus size={13} />}
                        {showForm ? 'Cancel' : 'Block IP'}
                    </button>
                </div>
            </div>

            {/* Add IP form */}
            {showForm && (
                <div className="px-5 py-4 animate-fade-slide-up border-b border-[#F1F5F9] bg-[#FEF2F2]">
                    <div className="flex gap-3">
                        <input
                            value={newIP}
                            onChange={e => setNewIP(e.target.value)}
                            placeholder="IP Address (e.g. 192.168.1.1)"
                            className="flex-1 h-9 px-3 rounded-lg text-[13px] text-[#0F172A] bg-white border border-[#FECACA] outline-none placeholder:text-[#94A3B8] focus:border-[#F87171]"
                        />
                        <input
                            value={newReason}
                            onChange={e => setNewReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="flex-1 h-9 px-3 rounded-lg text-[13px] text-[#0F172A] bg-white border border-[#FECACA] outline-none placeholder:text-[#94A3B8] focus:border-[#F87171]"
                        />
                        <button onClick={handleBlock} disabled={adding || !newIP.trim()}
                            className="flex items-center gap-2 px-4 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50">
                            <Ban size={14} /> {adding ? 'Blocking...' : 'Block'}
                        </button>
                    </div>
                </div>
            )}

            {/* IP list */}
            <div>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#F1F5F9] last:border-0">
                            <div className="h-4 w-32 rounded skeleton bg-[#F1F5F9]" />
                            <div className="h-4 flex-1 rounded skeleton bg-[#F8FAFC]" />
                        </div>
                    ))
                ) : blockedIPs.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-[#94A3B8]">
                        <Shield size={32} className="mb-2 text-[#34D399] opacity-80" />
                        <p className="text-[13px] text-[#059669] font-bold">No blocked IPs</p>
                        <p className="text-[11px] font-medium mt-0.5">All IP addresses are currently allowed</p>
                    </div>
                ) : blockedIPs.map(ip => (
                    <div key={ip.ip} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-analysis-pulse" />
                            <code className="text-[13px] font-mono font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded">{ip.ip}</code>
                        </div>
                        <span className="flex-1 text-[12px] font-medium text-[#64748B] truncate">
                            {ip.reason}
                        </span>
                        {ip.blockedAt && (
                            <span className="text-[11px] font-medium text-[#94A3B8] shrink-0">
                                {new Date(ip.blockedAt).toLocaleDateString()}
                            </span>
                        )}
                        <button onClick={() => handleUnblock(ip.ip)} disabled={unblocking === ip.ip}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-bold transition-all shrink-0 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] hover:bg-[#D1FAE5] disabled:opacity-50">
                            <Unlock size={12} /> {unblocking === ip.ip ? '...' : 'Unblock'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Active Sessions Table ───────────────────────────────────────────────────
function ActiveSessionsTable() {
    const [sessions, setSessions] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSessions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getAuditLogs({ page: 1, limit: 10, action: 'login' });
            setSessions(res.logs);
        } catch {}
        setLoading(false);
    }, []);

    useEffect(() => { loadSessions(); }, [loadSessions]);

    return (
        <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                    <User size={16} className="text-[#059669]" />
                    <span className="text-[13px] font-bold text-[#0F172A]">Recent Logins & IPs</span>
                </div>
                <button onClick={loadSessions} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} />
                </button>
            </div>
            <div>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#F1F5F9] last:border-0">
                            <div className="h-4 w-32 rounded skeleton bg-[#F1F5F9]" />
                            <div className="h-4 flex-1 rounded skeleton bg-[#F8FAFC]" />
                        </div>
                    ))
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-[#94A3B8]">
                        <User size={32} className="mb-2 opacity-50" />
                        <p className="text-[13px] font-medium">No recent logins</p>
                    </div>
                ) : sessions.map(session => (
                    <div key={session._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0">
                        <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                            <User size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#0F172A] truncate">{session.user?.name || 'Unknown User'}</p>
                            <p className="text-[11px] font-medium text-[#64748B] truncate">{session.user?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="text-[11px] font-mono font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-1 rounded">{session.ipAddress}</code>
                        </div>
                        <span className="text-[11px] font-medium text-[#94A3B8] shrink-0 ml-4">
                            {new Date(session.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Audit Log Table ─────────────────────────────────────────────────────────
function AuditLogTable() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [search, setSearch] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getAuditLogs({ page, limit: 20, action: actionFilter });
            setLogs(res.logs);
            setTotal(res.total);
            setPages(res.pages);
        } catch {}
        setLoading(false);
    }, [page, actionFilter]);

    useEffect(() => { loadLogs(); }, [loadLogs]);
    useEffect(() => { setPage(1); }, [actionFilter]);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(loadLogs, 15000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh, loadLogs]);

    const filtered = search
        ? logs.filter(l =>
            l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            l.ipAddress?.includes(search)
        )
        : logs;

    const AUDIT_ACTIONS = ['login', 'signup', 'logout', 'document_upload', 'document_delete', 'user_block', 'user_suspend', 'user_restore', 'ip_block', 'report_download'];

    return (
        <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center gap-2 mr-2">
                    <Activity size={16} className="text-[#6366F1]" />
                    <span className="text-[13px] font-bold text-[#0F172A]">Audit Logs</span>
                    {autoRefresh && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-analysis-pulse" />}
                </div>

                <div className="relative flex-1 min-w-[160px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, IP..."
                        className="w-full h-8 pl-8 pr-3 rounded-lg text-[12px] text-[#0F172A] bg-white border border-[#E2E8F0] outline-none placeholder:text-[#94A3B8] focus:border-[#93C5FD]" />
                </div>

                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
                    className="h-8 px-2 rounded-lg text-[12px] text-[#0F172A] bg-white border border-[#E2E8F0] outline-none cursor-pointer focus:border-[#93C5FD]">
                    <option value="">All Actions</option>
                    {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>

                <button onClick={() => setAutoRefresh(a => !a)}
                    className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-bold transition-all border shadow-sm',
                        autoRefresh ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    )}>
                    <RefreshCw size={12} className={autoRefresh ? 'animate-spin-slow' : ''} />
                    {autoRefresh ? 'Live' : 'Auto'}
                </button>

                <button onClick={loadLogs} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} />
                </button>
            </div>

            {/* Rows */}
            <div>
                {loading ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#F1F5F9] last:border-0">
                            <div className="w-8 h-8 rounded-lg skeleton bg-[#F1F5F9]" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 rounded skeleton bg-[#F1F5F9]" />
                                <div className="h-3 w-1/2 rounded skeleton bg-[#F8FAFC]" />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-[#94A3B8]">
                        <Activity size={32} className="mb-2 opacity-50" />
                        <p className="text-[13px] font-medium">No logs found</p>
                    </div>
                ) : filtered.map(log => {
                    const ac = AUDIT_ACTION_COLORS[log.action] || AUDIT_ACTION_COLORS.default;
                    return (
                        <div key={log._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                style={{ background: ac.bg, color: ac.color }}>
                                <Activity size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[12px] font-bold text-[#0F172A]">{log.user?.name || 'Unknown'}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                                        style={{ background: ac.bg, color: ac.color }}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[11px] font-medium text-[#64748B]">{log.resource}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[11px] font-medium text-[#64748B]">{log.user?.email}</span>
                                    <span className="text-[10px] font-mono text-[#94A3B8]">{log.ipAddress}</span>
                                    {log.adminUser && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                                            by {log.adminUser.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#94A3B8] shrink-0">
                                <Clock size={12} />
                                {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <span className="text-[12px] font-medium text-[#64748B]">
                        {total.toLocaleString()} total events
                    </span>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-all disabled:opacity-40">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[12px] font-bold text-[#0F172A] px-1">{page} / {pages}</span>
                        <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-all disabled:opacity-40">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminSecurityPage() {
    return (
        <div className="space-y-6">
            <div className="animate-fade-slide-up">
                <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Security Center</h1>
                <p className="text-[13px] mt-0.5 text-[#64748B] font-medium">
                    IP management, audit logs, and security events
                </p>
            </div>

            {/* Security Alert Banner */}
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl animate-fade-slide-up bg-[#EFF6FF] border border-[#BFDBFE]">
                <Shield size={18} className="text-[#2563EB] shrink-0" />
                <p className="text-[12.5px] font-medium text-[#1E3A8A]">
                    All admin actions are logged and audited. Audit logs auto-refresh when live mode is enabled.
                </p>
            </div>

            <IPBlockManager />
            <ActiveSessionsTable />
            <AuditLogTable />
        </div>
    );
}
