import { useEffect, useState, useCallback } from 'react';
import {
    Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal,
    UserX, UserCheck, Trash2, Eye, X,
    Users, Clock, FileText, Activity, AlertTriangle, RefreshCw
} from 'lucide-react';
import * as adminService from '@/services/adminService';
import type { AdminUser, AdminDocument, AuditLogEntry } from '@/types';
import { cn } from '@/utils/helpers';

const ROLE_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
    admin:     { label: 'Admin',     bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
    moderator: { label: 'Moderator', bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' },
    support:   { label: 'Support',   bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
    user:      { label: 'User',      bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
};

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    active:    { label: 'Active',    bg: '#D1FAE5', color: '#059669', dot: '#10B981' },
    suspended: { label: 'Suspended', bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
    blocked:   { label: 'Blocked',   bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
};

function formatBytes(b: number) {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['#6366F1', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
            {initials}
        </div>
    );
}

// ── User Detail Drawer ──────────────────────────────────────────────────────
function UserDrawer({ user, onClose, onStatusChange }: {
    user: AdminUser;
    onClose: () => void;
    onStatusChange: () => void;
}) {
    const [detail, setDetail] = useState<{ user: AdminUser; documents: AdminDocument[]; auditLogs: AuditLogEntry[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'logs'>('overview');

    useEffect(() => {
        adminService.getUserById(user._id).then(d => { setDetail(d); setLoading(false); });
    }, [user._id]);

    const handleStatus = async (status: 'active' | 'suspended' | 'blocked', reason?: string) => {
        setStatusLoading(true);
        try {
            await adminService.updateUserStatus(user._id, status, reason);
            onStatusChange();
        } catch {}
        setStatusLoading(false);
    };

    const handleRole = async (role: string) => {
        setRoleLoading(true);
        try {
            await adminService.updateUserRole(user._id, role);
            onStatusChange();
        } catch {}
        setRoleLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
            <div className="w-full max-w-lg flex flex-col bg-white shadow-2xl animate-fade-slide-up border-l border-[#E2E8F0]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-3">
                        <Avatar name={user.name} size={36} />
                        <div>
                            <p className="text-[14px] font-bold text-[#0F172A]">{user.name}</p>
                            <p className="text-[11px] text-[#64748B]">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 py-3 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                    {(['overview', 'documents', 'logs'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all border',
                                activeTab === tab 
                                    ? 'bg-white text-[#2563EB] border-[#BFDBFE] shadow-sm' 
                                    : 'text-[#64748B] hover:text-[#0F172A] border-transparent hover:bg-[#F1F5F9]'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto doc-scroll bg-[#F8FAFC]">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-12 rounded-xl skeleton bg-white border border-[#E2E8F0]" />
                            ))}
                        </div>
                    ) : activeTab === 'overview' ? (
                        <div className="p-6 space-y-6">
                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Documents', value: user.documentCount, icon: <FileText size={14} />, color: '#2563EB', bg: '#DBEAFE' },
                                    { label: 'Logins', value: user.loginCount, icon: <Activity size={14} />, color: '#059669', bg: '#D1FAE5' },
                                    { label: 'Failed', value: user.failedLoginAttempts, icon: <AlertTriangle size={14} />, color: '#D97706', bg: '#FEF3C7' },
                                ].map(({ label, value, icon, color, bg }) => (
                                    <div key={label} className="rounded-xl p-4 text-center bg-white border border-[#E2E8F0] shadow-sm">
                                        <div className="flex justify-center mb-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: bg, color }}>
                                                {icon}
                                            </div>
                                        </div>
                                        <div className="text-[20px] font-bold text-[#0F172A] leading-tight">{value ?? 0}</div>
                                        <div className="text-[11px] font-medium text-[#64748B]">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Details */}
                            <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm">
                                {[
                                    { label: 'Role', value: <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded border" style={{ background: ROLE_STYLES[user.role]?.bg, color: ROLE_STYLES[user.role]?.color, borderColor: ROLE_STYLES[user.role]?.border }}>{ROLE_STYLES[user.role]?.label}</span> },
                                    { label: 'Status', value: <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded border" style={{ background: STATUS_STYLES[user.status]?.bg, color: STATUS_STYLES[user.status]?.color, borderColor: STATUS_STYLES[user.status]?.bg }}>{STATUS_STYLES[user.status]?.label}</span> },
                                    { label: 'Joined', value: new Date(user.createdAt).toLocaleDateString() },
                                    { label: 'Last Login', value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never' },
                                    { label: 'Last IP Address', value: user.lastIpAddress ? <code className="text-[10px] bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold text-[#0F172A]">{user.lastIpAddress}</code> : '—' },
                                    { label: 'Suspend Reason', value: user.suspendedReason || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9] last:border-0">
                                        <span className="text-[12px] font-medium text-[#64748B]">{label}</span>
                                        <span className="text-[12px] font-semibold text-[#0F172A]">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Status Actions</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => handleStatus('active')} disabled={statusLoading || user.status === 'active'}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40 border bg-white hover:bg-[#F8FAFC]"
                                        style={{ borderColor: '#A7F3D0', color: '#059669' }}>
                                        <UserCheck size={16} /> Restore
                                    </button>
                                    <button onClick={() => handleStatus('suspended', 'Admin action')} disabled={statusLoading || user.status === 'suspended'}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40 border bg-white hover:bg-[#F8FAFC]"
                                        style={{ borderColor: '#FDE68A', color: '#D97706' }}>
                                        <Clock size={16} /> Suspend
                                    </button>
                                    <button onClick={() => handleStatus('blocked', 'Admin action')} disabled={statusLoading || user.status === 'blocked'}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40 border bg-white hover:bg-[#F8FAFC]"
                                        style={{ borderColor: '#FECACA', color: '#DC2626' }}>
                                        <UserX size={16} /> Block
                                    </button>
                                </div>
                            </div>

                            {/* Role Change */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Change Role</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['user', 'support', 'moderator', 'admin'] as const).map(r => (
                                        <button key={r} onClick={() => handleRole(r)} disabled={roleLoading || user.role === r}
                                            className="py-2.5 px-3 rounded-xl text-[12px] font-bold capitalize transition-all disabled:opacity-40"
                                            style={{ background: ROLE_STYLES[r]?.bg, color: ROLE_STYLES[r]?.color, border: `1px solid ${ROLE_STYLES[r]?.border}` }}>
                                            {ROLE_STYLES[r]?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'documents' ? (
                        <div className="p-4 space-y-2">
                            {detail?.documents.length === 0 ? (
                                <div className="text-center py-12 text-[#94A3B8]">
                                    <FileText size={28} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-[13px] font-medium">No documents</p>
                                </div>
                            ) : detail?.documents.map(doc => (
                                <div key={doc._id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] shrink-0">
                                        <FileText size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-[#0F172A] truncate">{doc.name}</p>
                                        <p className="text-[10px] font-medium text-[#64748B]">
                                            {formatBytes(doc.size)} · {doc.status}
                                        </p>
                                    </div>
                                    {doc.riskLevel && (
                                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border',
                                            doc.riskLevel === 'high' ? 'text-red-700 bg-red-50 border-red-200' :
                                            doc.riskLevel === 'medium' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-green-700 bg-green-50 border-green-200'
                                        )}>
                                            {doc.riskLevel}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            {detail?.auditLogs.length === 0 ? (
                                <div className="text-center py-12 text-[#94A3B8]">
                                    <Activity size={28} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-[13px] font-medium">No logs</p>
                                </div>
                            ) : detail?.auditLogs.map(log => (
                                <div key={log._id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                                    <span className="text-[12px] font-semibold text-[#0F172A] capitalize">{log.action.replace(/_/g, ' ')}</span>
                                    <span className="ml-auto text-[10px] font-medium text-[#94A3B8]">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getUsers({ page, limit: 15, search, role: roleFilter, status: statusFilter });
            setUsers(res.users);
            setTotal(res.total);
            setPages(res.pages);
        } catch {}
        setLoading(false);
    }, [page, search, roleFilter, statusFilter]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // Debounce search
    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

    const handleDelete = async (id: string) => {
        try {
            await adminService.deleteUser(id);
            setDeleteConfirm(null);
            loadUsers();
        } catch {}
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-slide-up">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">User Management</h1>
                    <p className="text-[13px] mt-0.5 text-[#64748B] font-medium">
                        {total.toLocaleString()} total users
                    </p>
                </div>
                <button onClick={loadUsers} className="cf-btn cf-btn-secondary cf-btn-sm">
                    <RefreshCw size={13} className={loading ? 'animate-spin-slow' : ''} /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-3 animate-fade-slide-up">
                <div className="relative flex-1 w-full md:w-auto min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="cf-input !pl-9"
                    />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="cf-input w-full md:!w-40 cursor-pointer">
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="support">Support</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cf-input w-full md:!w-40 cursor-pointer">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm animate-fade-slide-up pb-1"
                style={{ overflow: 'visible' }}> {/* Removed overflow-hidden to fix dropdown overlap */}
                {/* Table Header */}
                <div className="grid gap-4 px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-xl"
                    style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 40px' }}>
                    <span>User</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Docs</span>
                    <span>Last Login</span>
                    <span />
                </div>

                {/* Rows */}
                {loading ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="grid gap-4 px-6 py-4 items-center border-b border-[#F1F5F9] last:border-0"
                            style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 40px' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full skeleton bg-[#F1F5F9]" />
                                <div className="h-3 w-28 rounded skeleton bg-[#F1F5F9]" />
                            </div>
                            {[...Array(5)].map((__, j) => (
                                <div key={j} className="h-3 rounded skeleton bg-[#F8FAFC]" />
                            ))}
                        </div>
                    ))
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-[#94A3B8]">
                        <Users size={32} className="mb-2 opacity-50" />
                        <p className="text-[13px] font-medium">No users found</p>
                    </div>
                ) : users.map((u) => {
                    const rs = ROLE_STYLES[u.role] || ROLE_STYLES.user;
                    const ss = STATUS_STYLES[u.status] || STATUS_STYLES.active;
                    return (
                        <div
                            key={u._id}
                            className={cn("grid gap-4 px-6 py-3.5 items-center hover:bg-[#F8FAFC] transition-colors relative border-b border-[#F1F5F9] last:border-0",
                                actionMenuId === u._id ? "z-50" : "z-0")}
                            style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 40px' }}
                        >
                            {/* Name + Avatar */}
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar name={u.name} size={32} />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-[#0F172A] truncate">{u.name}</p>
                                    <p className="text-[10px] font-medium text-[#94A3B8] truncate">
                                        Joined {new Date(u.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            {/* Email */}
                            <p className="text-[12px] font-medium text-[#64748B] truncate">{u.email}</p>
                            {/* Role */}
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded border w-fit"
                                style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}>
                                {rs.label}
                            </span>
                            {/* Status */}
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full animate-analysis-pulse" style={{ background: ss.dot }} />
                                <span className="text-[11px] font-bold" style={{ color: ss.color }}>{ss.label}</span>
                            </div>
                            {/* Docs */}
                            <span className="text-[13px] font-bold text-[#0F172A]">{u.documentCount}</span>
                            {/* Last Login */}
                            <span className="text-[11px] font-medium text-[#94A3B8]">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                            </span>
                            {/* Actions */}
                            <div className="relative">
                                <button
                                    onClick={() => setActionMenuId(actionMenuId === u._id ? null : u._id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors">
                                    <MoreHorizontal size={15} />
                                </button>
                                {actionMenuId === u._id && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
                                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-[#E2E8F0] shadow-xl z-50 animate-scale-in py-1">
                                            <button onClick={() => { setSelectedUser(u); setActionMenuId(null); }}
                                                className="flex w-full items-center gap-2.5 px-4 py-2 text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors">
                                                <Eye size={14} className="text-[#94A3B8]" /> View Details
                                            </button>
                                            <button onClick={() => { adminService.updateUserStatus(u._id, 'blocked', 'Admin block').then(loadUsers); setActionMenuId(null); }}
                                                className="flex w-full items-center gap-2.5 px-4 py-2 text-[12px] font-semibold text-[#D97706] hover:bg-[#FEF3C7] transition-colors">
                                                <UserX size={14} /> Block User
                                            </button>
                                            <button onClick={() => { adminService.updateUserStatus(u._id, 'active').then(loadUsers); setActionMenuId(null); }}
                                                className="flex w-full items-center gap-2.5 px-4 py-2 text-[12px] font-semibold text-[#059669] hover:bg-[#D1FAE5] transition-colors">
                                                <UserCheck size={14} /> Restore
                                            </button>
                                            <div className="h-px bg-[#F1F5F9] my-1" />
                                            <button onClick={() => { setDeleteConfirm(u._id); setActionMenuId(null); }}
                                                className="flex w-full items-center gap-2.5 px-4 py-2 text-[12px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors">
                                                <Trash2 size={14} /> Delete User
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between animate-fade-slide-up">
                    <p className="text-[12px] font-medium text-[#64748B]">
                        Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] transition-all disabled:opacity-40">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[13px] font-bold text-[#0F172A] px-2">{page} / {pages}</span>
                        <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] transition-all disabled:opacity-40">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* User Drawer */}
            {selectedUser && (
                <UserDrawer
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onStatusChange={() => { loadUsers(); setSelectedUser(null); }}
                />
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm">
                    <div className="rounded-2xl p-6 w-full max-w-sm mx-4 bg-white border border-[#E2E8F0] shadow-2xl animate-scale-in">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full mb-4 bg-red-50">
                            <Trash2 size={20} className="text-red-600" />
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] mb-1">Delete User</h3>
                        <p className="text-[13px] text-[#64748B] font-medium mb-6">
                            This will permanently delete the user and all their documents. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="cf-btn cf-btn-secondary flex-1 justify-center">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="cf-btn flex-1 justify-center bg-red-600 hover:bg-red-700 text-white shadow-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
