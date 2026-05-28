import { useEffect, useState } from 'react';
import { RefreshCw, Users, FileText, HardDrive, Activity } from 'lucide-react';
import * as adminService from '@/services/adminService';
import type { AnalyticsOverview, ActivityDataPoint } from '@/types';

function formatBytes(b: number) {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

// Simple SVG bar chart
function BarChart({
    data,
    color,
    label,
}: {
    data: { date: string; value: number }[];
    color: string;
    label: string;
}) {
    const max = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="relative h-40 flex items-end gap-px">
            {data.map((d, i) => (
                <div key={i} className="flex-1 group relative flex items-end">
                    <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                            height: `${Math.max((d.value / max) * 100, 2)}%`,
                            background: d.value > 0 ? color : '#F1F5F9',
                            opacity: d.value > 0 ? 0.9 : 0.5,
                        }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="text-[10px] font-bold text-white px-2 py-1 rounded-md whitespace-nowrap bg-[#0F172A] shadow-md">
                            {d.date}: {d.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// SVG Donut chart
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    let cumulative = 0;
    const r = 60, cx = 70, cy = 70, strokeW = 22;
    const circumference = 2 * Math.PI * r;

    const arcs = segments.map(seg => {
        const pct = seg.value / total;
        const dashArray = `${pct * circumference} ${circumference}`;
        const dashOffset = -cumulative * circumference;
        cumulative += pct;
        return { ...seg, pct, dashArray, dashOffset };
    });

    return (
        <div className="flex items-center gap-6">
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={strokeW} />
                {arcs.map((arc, i) => (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={strokeW}
                        strokeDasharray={arc.dashArray}
                        strokeDashoffset={arc.dashOffset}
                        transform={`rotate(-90, ${cx}, ${cy})`}
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                ))}
                <text x={cx} y={cy - 6} textAnchor="middle" fill="#0F172A" fontSize="18" fontWeight="700">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600">Total</text>
            </svg>
            <div className="space-y-2">
                {arcs.map((arc, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: arc.color }} />
                        <span className="text-[12px] font-medium text-[#64748B]">{arc.label}</span>
                        <span className="text-[12px] font-bold text-[#0F172A] ml-auto pl-4">{arc.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Horizontal bar
function HorizBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-[#64748B] truncate pr-2">{label}</span>
                <span className="text-[12px] font-bold text-[#0F172A] shrink-0">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-[#F1F5F9]">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
            </div>
        </div>
    );
}

// Generate last 30 days date labels
function buildTimeseries(data: ActivityDataPoint[]): { date: string; value: number }[] {
    const map: Record<string, number> = {};
    data.forEach(d => { map[d._id] = d.count; });

    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const key = d.toISOString().slice(0, 10);
        return { date: key.slice(5), value: map[key] || 0 };
    });
}

export default function AdminAnalyticsPage() {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [uploads, setUploads] = useState<{ date: string; value: number }[]>([]);
    const [logins, setLogins] = useState<{ date: string; value: number }[]>([]);
    const [riskData, setRiskData] = useState<{ _id: string; count: number; avgScore: number }[]>([]);
    const [clauseTypes, setClauseTypes] = useState<{ _id: string; count: number }[]>([]);
    const [topUsers, setTopUsers] = useState<{ _id: string; count: number; name: string; email: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ov, activity, risk] = await Promise.all([
                adminService.getAnalyticsOverview(),
                adminService.getActivityTimeseries(),
                adminService.getRiskAnalytics(),
            ]);
            setOverview(ov);
            setUploads(buildTimeseries(activity.uploads));
            setLogins(buildTimeseries(activity.logins));
            setRiskData(risk.riskDist);
            setClauseTypes(risk.clauseTypes);
            setTopUsers(risk.topUsers);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const riskSegments = [
        { label: 'High Risk', value: riskData.find(r => r._id === 'high')?.count || 0, color: '#DC2626' },
        { label: 'Medium Risk', value: riskData.find(r => r._id === 'medium')?.count || 0, color: '#D97706' },
        { label: 'Low Risk', value: riskData.find(r => r._id === 'low')?.count || 0, color: '#059669' },
    ];

    const maxClause = Math.max(...clauseTypes.map(c => c.count), 1);

    const CLAUSE_COLORS = ['#4F46E5', '#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626', '#DB2777', '#0D9488', '#EA580C', '#0891B2'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-slide-up">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Analytics</h1>
                    <p className="text-[13px] mt-0.5 text-[#64748B] font-medium">Platform-wide data insights</p>
                </div>
                <button onClick={loadData} className="cf-btn cf-btn-secondary cf-btn-sm">
                    <RefreshCw size={13} className={loading ? 'animate-spin-slow' : ''} /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-slide-up stagger">
                {[
                    { label: 'Total Users', value: overview?.totalUsers ?? '—', icon: <Users size={18} />, color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
                    { label: 'Total Documents', value: overview?.totalDocuments ?? '—', icon: <FileText size={18} />, color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
                    { label: 'Storage Used', value: formatBytes(overview?.totalStorageBytes || 0), icon: <HardDrive size={18} />, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
                    { label: 'Logins (24h)', value: overview?.recentLogins ?? '—', icon: <Activity size={18} />, color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
                ].map(({ label, value, icon, color, bg, border }, i) => (
                    <div key={label} className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4" style={{ background: bg, color, border: `1px solid ${border}` }}>
                            {icon}
                        </div>
                        <div className="text-[24px] font-bold text-[#0F172A] leading-tight mb-1">{value.toLocaleString?.() ?? value}</div>
                        <div className="text-[12px] font-medium text-[#64748B]">{label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1: Uploads + Logins */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Uploads Chart */}
                <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[13px] font-bold text-[#0F172A]">Document Uploads</p>
                            <p className="text-[11px] font-medium text-[#94A3B8]">Last 30 days</p>
                        </div>
                        <div className="text-[20px] font-bold text-[#4F46E5]">
                            {uploads.reduce((s, d) => s + d.value, 0)}
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-40 rounded-xl skeleton bg-[#F1F5F9]" />
                    ) : (
                        <BarChart data={uploads} color="#6366F1" label="uploads" />
                    )}
                    <div className="flex justify-between mt-3">
                        <span className="text-[10px] font-medium text-[#94A3B8]">{uploads[0]?.date}</span>
                        <span className="text-[10px] font-medium text-[#94A3B8]">{uploads[uploads.length - 1]?.date}</span>
                    </div>
                </div>

                {/* Logins Chart */}
                <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[13px] font-bold text-[#0F172A]">User Logins</p>
                            <p className="text-[11px] font-medium text-[#94A3B8]">Last 30 days</p>
                        </div>
                        <div className="text-[20px] font-bold text-[#059669]">
                            {logins.reduce((s, d) => s + d.value, 0)}
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-40 rounded-xl skeleton bg-[#F1F5F9]" />
                    ) : (
                        <BarChart data={logins} color="#10B981" label="logins" />
                    )}
                    <div className="flex justify-between mt-3">
                        <span className="text-[10px] font-medium text-[#94A3B8]">{logins[0]?.date}</span>
                        <span className="text-[10px] font-medium text-[#94A3B8]">{logins[logins.length - 1]?.date}</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Risk Donut + Clause Types + Top Users */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Risk Distribution */}
                <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <p className="text-[13px] font-bold text-[#0F172A] mb-6">Risk Distribution</p>
                    {loading ? (
                        <div className="h-36 rounded-xl skeleton bg-[#F1F5F9]" />
                    ) : (
                        <DonutChart segments={riskSegments} />
                    )}
                </div>

                {/* Top Clause Types */}
                <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <p className="text-[13px] font-bold text-[#0F172A] mb-6">Top Clause Types</p>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-6 rounded-lg skeleton bg-[#F1F5F9]" />
                            ))}
                        </div>
                    ) : clauseTypes.length === 0 ? (
                        <div className="text-center py-8 text-[#94A3B8]">
                            <p className="text-[12px] font-medium">No clause data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {clauseTypes.slice(0, 7).map((c, i) => (
                                <HorizBar key={c._id} label={c._id} value={c.count} max={maxClause} color={CLAUSE_COLORS[i % CLAUSE_COLORS.length]} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Users by Upload Count */}
                <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <p className="text-[13px] font-bold text-[#0F172A] mb-5">Top Users by Uploads</p>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 rounded-xl skeleton bg-[#F1F5F9]" />
                            ))}
                        </div>
                    ) : topUsers.length === 0 ? (
                        <div className="text-center py-8 text-[#94A3B8]">
                            <p className="text-[12px] font-medium">No user data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topUsers.map((u, i) => (
                                <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
                                    <div className="text-[11px] font-black w-5 shrink-0 text-[#2563EB]">#{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-[#0F172A] truncate">{u.name || '—'}</p>
                                        <p className="text-[10px] font-medium text-[#64748B] truncate">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#2563EB] shrink-0 bg-[#EFF6FF] px-2 py-1 rounded-md">
                                        <FileText size={12} />
                                        {u.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
