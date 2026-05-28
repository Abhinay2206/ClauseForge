import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, FileText, HardDrive, Activity, TrendingUp, TrendingDown,
    ShieldAlert, CheckCircle2, Clock, ArrowRight, RefreshCw,
    AlertTriangle, Zap
} from 'lucide-react';
import * as adminService from '@/services/adminService';
import type { AnalyticsOverview, AuditLogEntry } from '@/types';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const ACTION_ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    login: { icon: <CheckCircle2 size={13} />, color: '#059669', bg: '#D1FAE5' },
    signup: { icon: <Users size={13} />, color: '#2563EB', bg: '#DBEAFE' },
    document_upload: { icon: <FileText size={13} />, color: '#7C3AED', bg: '#EDE9FE' },
    document_delete: { icon: <AlertTriangle size={13} />, color: '#DC2626', bg: '#FEE2E2' },
    user_block: { icon: <ShieldAlert size={13} />, color: '#D97706', bg: '#FEF3C7' },
    report_download: { icon: <FileText size={13} />, color: '#059669', bg: '#D1FAE5' },
    default: { icon: <Activity size={13} />, color: '#475569', bg: '#F1F5F9' },
};

function StatCard({
    label, value, icon, iconBg, iconColor, trend, trendLabel, delay = 0
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    delay?: number;
}) {
    return (
        <div
            className="rounded-xl p-5 bg-white border border-[#E2E8F0] animate-fade-slide-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: iconBg, color: iconColor }}>
                    {icon}
                </div>
                {trend && trendLabel && (
                    <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
                        trend === 'up' ? 'text-emerald-600 bg-emerald-50' :
                        trend === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'
                    }`}>
                        {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : null}
                        {trendLabel}
                    </div>
                )}
            </div>
            <div className="text-[26px] font-bold text-[#0F172A] leading-none mb-1.5">{value}</div>
            <div className="text-[12px] font-medium text-[#94A3B8]">{label}</div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const loadData = async () => {
        setLoading(true);
        try {
            const [ov, logs] = await Promise.all([
                adminService.getAnalyticsOverview(),
                adminService.getAuditLogs({ limit: 12 })
            ]);
            setOverview(ov);
            setRecentLogs(logs.logs);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to load admin dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const completedDocs = overview?.docsByStatus?.['completed'] || 0;
    const totalDocs = overview?.totalDocuments || 0;
    const highRisk = overview?.docsByRisk?.['high'] || 0;

    return (
        <div className="space-y-6" style={{ minHeight: '100%' }}>

            {/* Header */}
            <div className="flex items-center justify-between animate-fade-slide-up">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Admin Dashboard</h1>
                    <p className="text-[13px] mt-0.5 text-[#94A3B8]">
                        Platform overview · Last updated {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="cf-btn cf-btn-primary cf-btn-sm"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin-slow' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-36 rounded-xl bg-white border border-[#E2E8F0] skeleton" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Users"
                        value={overview?.totalUsers?.toLocaleString() || '0'}
                        icon={<Users size={18} />}
                        iconBg="#EDE9FE" iconColor="#7C3AED"
                        trend="up"
                        trendLabel={`${overview?.usersByRole?.['user'] || 0} users`}
                        delay={0}
                    />
                    <StatCard
                        label="Total Documents"
                        value={totalDocs.toLocaleString()}
                        icon={<FileText size={18} />}
                        iconBg="#DBEAFE" iconColor="#2563EB"
                        trend="up"
                        trendLabel={`${completedDocs} analyzed`}
                        delay={50}
                    />
                    <StatCard
                        label="Storage Used"
                        value={formatBytes(overview?.totalStorageBytes || 0)}
                        icon={<HardDrive size={18} />}
                        iconBg="#FEF3C7" iconColor="#D97706"
                        delay={100}
                    />
                    <StatCard
                        label="Logins (24h)"
                        value={overview?.recentLogins?.toLocaleString() || '0'}
                        icon={<Activity size={18} />}
                        iconBg="#D1FAE5" iconColor="#059669"
                        trend={highRisk > 0 ? 'down' : 'up'}
                        trendLabel={`${highRisk} high-risk docs`}
                        delay={150}
                    />
                </div>
            )}

            {/* Two-column section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Recent Activity */}
                <div className="xl:col-span-2 rounded-xl overflow-hidden bg-white border border-[#E2E8F0] animate-fade-slide-up">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-analysis-pulse" />
                            <span className="text-[13px] font-semibold text-[#0F172A]">Recent Activity</span>
                        </div>
                        <button
                            onClick={() => navigate('/admin/security')}
                            className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                        >
                            View all <ArrowRight size={11} />
                        </button>
                    </div>

                    <div className="divide-y divide-[#F1F5F9]">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3">
                                    <div className="w-7 h-7 rounded-lg skeleton bg-[#F1F5F9]" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-3/4 rounded skeleton bg-[#F1F5F9]" />
                                        <div className="h-2.5 w-1/2 rounded skeleton bg-[#F8FAFC]" />
                                    </div>
                                </div>
                            ))
                        ) : recentLogs.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-[#94A3B8]">
                                <Activity size={28} className="mb-2" />
                                <p className="text-[13px]">No activity yet</p>
                            </div>
                        ) : (
                            recentLogs.map((log) => {
                                const ac = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                                return (
                                    <div key={log._id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                                            style={{ background: ac.bg, color: ac.color }}>
                                            {ac.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-medium text-[#0F172A] truncate">
                                                    {log.user?.name || 'Unknown User'}
                                                </span>
                                                <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium"
                                                    style={{ background: ac.bg, color: ac.color }}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-[#94A3B8]">
                                                    {log.user?.email}
                                                </span>
                                                <span className="text-[10px] text-[#CBD5E1]">·</span>
                                                <span className="text-[11px] text-[#94A3B8]">
                                                    {log.ipAddress}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] shrink-0 text-[#94A3B8]">
                                            <Clock size={10} />
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Quick Stats & Actions */}
                <div className="space-y-4">

                    {/* Platform Composition */}
                    <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] animate-fade-slide-up">
                        <p className="text-[12px] font-semibold text-[#0F172A] mb-4">Platform Breakdown</p>
                        <div className="space-y-3">
                            {[
                                { label: 'Users', value: overview?.usersByRole?.['user'] || 0, color: '#2563EB', total: overview?.totalUsers || 1 },
                                { label: 'Moderators', value: overview?.usersByRole?.['moderator'] || 0, color: '#7C3AED', total: overview?.totalUsers || 1 },
                                { label: 'Admins', value: overview?.usersByRole?.['admin'] || 0, color: '#0F172A', total: overview?.totalUsers || 1 },
                            ].map(({ label, value, color, total }) => (
                                <div key={label}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[11px] font-medium text-[#64748B]">{label}</span>
                                        <span className="text-[11px] font-semibold text-[#0F172A]">{value}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[#F1F5F9]">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min((value / total) * 100, 100)}%`, background: color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Document Status */}
                    <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] animate-fade-slide-up">
                        <p className="text-[12px] font-semibold text-[#0F172A] mb-4">Document Status</p>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Completed', key: 'completed', color: '#059669' },
                                { label: 'Analyzing', key: 'analyzing', color: '#2563EB' },
                                { label: 'Pending', key: 'pending', color: '#D97706' },
                                { label: 'Failed', key: 'failed', color: '#DC2626' },
                            ].map(({ label, key, color }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                        <span className="text-[11px] font-medium text-[#64748B]">{label}</span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[#0F172A]">
                                        {overview?.docsByStatus?.[key] || 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] animate-fade-slide-up">
                        <p className="text-[12px] font-semibold text-[#0F172A] mb-3">Quick Actions</p>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Manage Users', path: '/admin/users', icon: <Users size={12} />, color: '#2563EB' },
                                { label: 'View Analytics', path: '/admin/analytics', icon: <Zap size={12} />, color: '#D97706' },
                                { label: 'Security Center', path: '/admin/security', icon: <ShieldAlert size={12} />, color: '#DC2626' },
                                { label: 'System Health', path: '/admin/system', icon: <Activity size={12} />, color: '#059669' },
                            ].map(({ label, path, icon, color }) => (
                                <button
                                    key={path}
                                    onClick={() => navigate(path)}
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-150 group border border-[#F1F5F9] hover:border-[#E2E8F0] hover:bg-[#F8FAFC]"
                                >
                                    <div className="flex items-center gap-2">
                                        <span style={{ color }}>{icon}</span>
                                        <span className="text-[#475569]">{label}</span>
                                    </div>
                                    <ArrowRight size={11} className="text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
