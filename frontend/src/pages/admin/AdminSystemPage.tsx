import { useEffect, useState } from 'react';
import {
    Database, Server, Activity, Cpu, RefreshCw,
    CheckCircle2, XCircle, Zap, HardDrive,
    Circle
} from 'lucide-react';
import * as adminService from '@/services/adminService';
import type { SystemHealth, RedisStats, DLQJob, AuditLogEntry } from '@/types';
import { cn } from '@/utils/helpers';

function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${Math.floor(seconds % 60)}s`;
}

function HealthCard({
    title, subtitle, connected, latency, icon, color, bg, extra
}: {
    title: string;
    subtitle: string;
    connected: boolean;
    latency?: number | null;
    icon: React.ReactNode;
    color: string;
    bg: string;
    extra?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl p-5 animate-fade-slide-up bg-white shadow-sm transition-all"
            style={{ border: `1px solid ${connected ? '#E2E8F0' : '#FECACA'}` }}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: bg, color }}>
                    {icon}
                </div>
                <div className={cn('flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md border',
                    connected ? 'text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]' : 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]')}>
                    {connected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {connected ? 'Healthy' : 'Offline'}
                </div>
            </div>
            <h3 className="text-[15px] font-bold text-[#0F172A]">{title}</h3>
            <p className="text-[12px] mt-0.5 text-[#64748B] font-medium">{subtitle}</p>
            {latency !== undefined && latency !== null && (
                <div className="flex items-center gap-1.5 mt-3">
                    <Zap size={12} className="text-[#D97706]" />
                    <span className="text-[11px] font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-md border border-[#FDE68A]">{latency}ms latency</span>
                </div>
            )}
            {extra}
        </div>
    );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
            <span className="text-[12px] font-medium text-[#64748B]">{label}</span>
            <span className="text-[13px] font-bold" style={{ color: color || '#0F172A' }}>{value}</span>
        </div>
    );
}

function HitRateBar({ hits, misses }: { hits: number; misses: number }) {
    const total = hits + misses || 1;
    const hitRate = Math.round((hits / total) * 100);
    return (
        <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
            <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-medium text-[#64748B]">Cache Hit Rate</span>
                <span className="text-[12px] font-bold" style={{ color: hitRate > 70 ? '#059669' : hitRate > 40 ? '#D97706' : '#DC2626' }}>
                    {hitRate}%
                </span>
            </div>
            <div className="h-2 rounded-full bg-[#F1F5F9]">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${hitRate}%`,
                        background: hitRate > 70 ? '#10B981' :
                                    hitRate > 40 ? '#F59E0B' :
                                    '#EF4444'
                    }} />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-[10px] font-medium text-[#94A3B8]">{hits.toLocaleString()} hits</span>
                <span className="text-[10px] font-medium text-[#94A3B8]">{misses.toLocaleString()} misses</span>
            </div>
        </div>
    );
}

export default function AdminSystemPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'dlq' | 'audit'>('overview');
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [redis, setRedis] = useState<RedisStats | null>(null);
    const [dlqJobs, setDlqJobs] = useState<DLQJob[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [h, r, dlq, logs] = await Promise.all([
                adminService.getSystemHealth(),
                adminService.getRedisStats(),
                adminService.getDLQJobs(),
                adminService.getAuditLogs({ limit: 50 })
            ]);
            setHealth(h);
            setRedis(r);
            setDlqJobs(dlq.jobs);
            setAuditLogs(logs.logs);
            setLastChecked(new Date());
        } catch {}
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    // Server uptime formatted
    const uptimeStr = health ? formatUptime(health.server.uptime) : '—';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-slide-up">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">System Health</h1>
                    <p className="text-[13px] mt-0.5 text-[#64748B] font-medium">
                        {lastChecked ? `Last checked at ${lastChecked.toLocaleTimeString()}` : 'Loading...'}
                    </p>
                </div>
                <button onClick={loadData} className="cf-btn cf-btn-secondary cf-btn-sm">
                    <RefreshCw size={13} className={loading ? 'animate-spin-slow' : ''} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-[#E2E8F0] animate-fade-slide-up">
                {(['overview', 'dlq', 'audit'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'px-4 py-2 text-[13px] font-bold capitalize transition-all border-b-2',
                            activeTab === tab 
                                ? 'border-[#2563EB] text-[#2563EB]' 
                                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                        )}
                    >
                        {tab === 'dlq' ? 'Dead Letter Queue' : tab === 'audit' ? 'Audit Logs' : 'System Overview'}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Service Health Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-44 rounded-xl skeleton bg-[#F1F5F9]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
                    <HealthCard
                        title="MongoDB"
                        subtitle="Primary database"
                        connected={health?.mongodb.connected ?? false}
                        icon={<Database size={18} />}
                        color="#7C3AED"
                        bg="#EDE9FE"
                    />
                    <HealthCard
                        title="Redis"
                        subtitle="Cache & rate limiting"
                        connected={health?.redis.connected ?? false}
                        latency={health?.redis.pingMs}
                        icon={<Zap size={18} />}
                        color="#059669"
                        bg="#D1FAE5"
                    />
                    <HealthCard
                        title="BullMQ Queue"
                        subtitle="Document processing"
                        connected={true}
                        icon={<Activity size={18} />}
                        color="#2563EB"
                        bg="#DBEAFE"
                        extra={
                            <div className="flex items-center gap-1.5 mt-3">
                                <Circle size={11} style={{ fill: health?.queue.depth === 0 ? '#10B981' : '#F59E0B', color: health?.queue.depth === 0 ? '#10B981' : '#F59E0B' }} />
                                <span className="text-[11px] font-semibold text-[#64748B]">
                                    {health?.queue.depth ?? 0} jobs in queue
                                </span>
                            </div>
                        }
                    />
                    <HealthCard
                        title="AI Microservice"
                        subtitle="Python FastAPI service"
                        connected={health?.aiService.healthy ?? false}
                        icon={<Cpu size={18} />}
                        color="#D97706"
                        bg="#FEF3C7"
                        extra={
                            <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-[#FDE68A]/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-[#64748B]">API Calls</span>
                                    <span className="text-[11px] font-bold text-[#0F172A]">{health?.aiService.usage?.totalCalls?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-[#64748B]">Tokens Used</span>
                                    <span className="text-[11px] font-bold text-[#0F172A]">{health?.aiService.usage?.totalTokens?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        }
                    />
                </div>
            )}

            {/* Server Info + Redis Stats */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Server Info */}
                <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                            <Server size={15} />
                        </div>
                        <span className="text-[14px] font-bold text-[#0F172A]">Node.js Server</span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-6 rounded-lg skeleton bg-[#F1F5F9]" />)}
                        </div>
                    ) : (
                        <div>
                            <StatRow label="Uptime" value={uptimeStr} color="#059669" />
                            <StatRow label="Node Version" value={health?.server.nodeVersion || '—'} />
                            <StatRow label="Platform" value={health?.server.platform || '—'} />
                            <StatRow label="Heap Memory Used" value={`${health?.server.memoryMB ?? '—'} MB`}
                                color={(health?.server.memoryMB || 0) > 512 ? '#D97706' : '#059669'} />
                            <StatRow label="MongoDB State" value={health?.mongodb.connected ? 'Connected' : 'Disconnected'}
                                color={health?.mongodb.connected ? '#059669' : '#DC2626'} />
                            <StatRow label="Last Health Check" value={health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : '—'} />
                        </div>
                    )}
                </div>

                {/* Redis Stats */}
                <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                            <Zap size={15} />
                        </div>
                        <span className="text-[14px] font-bold text-[#0F172A]">Redis Cache Stats</span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-6 rounded-lg skeleton bg-[#F1F5F9]" />)}
                        </div>
                    ) : !redis ? (
                        <div className="flex flex-col items-center py-10 text-[#94A3B8]">
                            <XCircle size={32} className="mb-2 text-[#DC2626] opacity-50" />
                            <p className="text-[13px] font-medium">Redis stats unavailable</p>
                        </div>
                    ) : (
                        <div>
                            <StatRow label="Redis Version" value={redis.redisVersion} />
                            <StatRow label="Memory Used" value={redis.usedMemory} color="#7C3AED" />
                            <StatRow label="Peak Memory" value={redis.usedMemoryPeak} />
                            <StatRow label="Total Keys" value={redis.totalKeys.toLocaleString()} color="#2563EB" />
                            <StatRow label="Connected Clients" value={redis.connectedClients} />
                            <StatRow label="Commands Processed" value={redis.totalCommandsProcessed.toLocaleString()} />
                            <StatRow label="Uptime" value={formatUptime(redis.uptimeSeconds)} />
                            <HitRateBar hits={redis.keyspaceHits} misses={redis.keyspaceMisses} />
                        </div>
                    )}
                </div>
            </div>

            {/* Memory Visualization */}
            {!loading && health && (
                <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] flex items-center justify-center">
                            <HardDrive size={15} />
                        </div>
                        <span className="text-[14px] font-bold text-[#0F172A]">Infrastructure Overview</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            {
                                label: 'Server Memory',
                                value: `${health.server.memoryMB} MB`,
                                pct: Math.min((health.server.memoryMB / 1024) * 100, 100),
                                color: health.server.memoryMB > 512 ? '#D97706' : '#059669'
                            },
                            {
                                label: 'Queue Depth',
                                value: `${health.queue.depth} jobs`,
                                pct: Math.min(health.queue.depth * 10, 100),
                                color: health.queue.depth > 5 ? '#DC2626' : '#059669'
                            },
                            {
                                label: 'Redis Latency',
                                value: health.redis.pingMs !== null ? `${health.redis.pingMs}ms` : 'N/A',
                                pct: Math.min((health.redis.pingMs || 0) / 10 * 100, 100),
                                color: (health.redis.pingMs || 0) < 5 ? '#059669' : '#D97706'
                            },
                            {
                                label: 'Cache Keys',
                                value: redis ? redis.totalKeys.toLocaleString() : '—',
                                pct: Math.min((redis?.totalKeys || 0) / 1000 * 100, 100),
                                color: '#4F46E5'
                            }
                        ].map(({ label, value, pct, color }) => (
                            <div key={label} className="rounded-xl p-4 border border-[#F1F5F9] bg-[#F8FAFC]">
                                <div className="text-[20px] font-bold mb-1" style={{ color }}>{value}</div>
                                <div className="text-[11px] font-medium text-[#64748B] mb-3">{label}</div>
                                <div className="h-1.5 rounded-full bg-[#E2E8F0]">
                                    <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${pct}%`, background: color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            </div>
            )}

            {activeTab === 'dlq' && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
                        <div>
                            <h2 className="text-[15px] font-bold text-[#0F172A]">Dead Letter Queue (DLQ)</h2>
                            <p className="text-[12px] text-[#64748B]">Failed jobs from the document processing queue.</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-bold text-[#DC2626]">
                            {dlqJobs.length} Jobs
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-6 text-center text-[#64748B] text-[13px] animate-pulse">Loading DLQ jobs...</div>
                    ) : dlqJobs.length === 0 ? (
                        <div className="p-12 text-center text-[#64748B]">
                            <CheckCircle2 size={32} className="mx-auto mb-3 text-[#059669] opacity-50" />
                            <p className="text-[14px] font-medium text-[#0F172A]">Queue is clear</p>
                            <p className="text-[12px]">No failed jobs found in DLQ.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#F1F5F9]">
                            {dlqJobs.map(job => (
                                <div key={job.id} className="p-4 hover:bg-[#F8FAFC] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded border border-[#E2E8F0] bg-white text-[10px] font-bold font-mono text-[#475569]">
                                                #{job.id}
                                            </span>
                                            <span className="text-[13px] font-bold text-[#0F172A]">{job.name}</span>
                                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', 
                                                job.state === 'failed' ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]' : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]'
                                            )}>
                                                {job.state}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-medium text-[#94A3B8]">
                                            {new Date(job.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    {job.failedReason && (
                                        <div className="mt-2 p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-mono text-[#DC2626] break-all">
                                            {job.failedReason}
                                        </div>
                                    )}
                                    <div className="mt-2">
                                        <p className="text-[10px] font-bold uppercase text-[#94A3B8] mb-1">Job Data</p>
                                        <pre className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono text-[#475569] overflow-x-auto">
                                            {JSON.stringify(job.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm animate-fade-slide-up">
                    <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
                        <div>
                            <h2 className="text-[15px] font-bold text-[#0F172A]">Recent Audit Logs</h2>
                            <p className="text-[12px] text-[#64748B]">System-wide activity logs for auditing and debugging.</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-bold text-[#2563EB]">
                            {auditLogs.length} Logs
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-6 text-center text-[#64748B] text-[13px] animate-pulse">Loading audit logs...</div>
                    ) : auditLogs.length === 0 ? (
                        <div className="p-12 text-center text-[#64748B]">
                            <p className="text-[14px] font-medium text-[#0F172A]">No logs found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto doc-scroll">
                            {auditLogs.map(log => (
                                <div key={log._id} className="p-4 hover:bg-[#F8FAFC] transition-colors flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[13px] font-bold text-[#0F172A] capitalize">
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                                                {log.resource}
                                            </span>
                                            <span className="text-[10px] font-medium text-[#94A3B8] ml-auto">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-[12px] text-[#475569] mb-2 flex items-center gap-1.5">
                                            <span className="font-semibold">{log.user?.name || log.adminUser?.name || 'System'}</span>
                                            <span className="text-[#94A3B8]">({log.user?.email || log.adminUser?.email || 'N/A'})</span>
                                            <span className="text-[#E2E8F0]">|</span>
                                            <span className="font-mono text-[#94A3B8] text-[10px]">{log.ipAddress}</span>
                                        </div>
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <pre className="mt-1 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono text-[#475569] overflow-x-auto">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
