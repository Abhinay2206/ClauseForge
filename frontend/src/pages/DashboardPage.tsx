import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    FileSearch,
    ShieldAlert,
    GitCompareArrows,
    ArrowRight,
    TrendingUp,
    AlertTriangle,
    FileText,
    Sparkles,
} from 'lucide-react';
import DocumentCard from '@/components/DocumentCard';
import { useAuthStore } from '@/store/authStore';
import { useDocumentStore } from '@/store/documentStore';
import { cn } from '@/utils/helpers';
import type { Document } from '@/types';

/* ─────────────────────────────────
   Empty state — no documents yet
───────────────────────────────── */
function EmptyState() {
    const navigate = useNavigate();
    const features = [
        {
            icon: FileSearch,
            title: 'Clause Detection',
            desc: 'Automatically identify and categorize contract clauses with AI.',
        },
        {
            icon: ShieldAlert,
            title: 'Risk Scoring',
            desc: 'Get an instant risk score with plain-language explanations.',
        },
        {
            icon: GitCompareArrows,
            title: 'Document Comparison',
            desc: 'Compare contract versions and surface every material change.',
        },
    ];

    return (
        <div className="cf-page">
            {/* Hero */}
            <div className="flex flex-col items-center text-center pt-10 pb-4 animate-fade-slide-up">
                {/* Illustration */}
                <div className="relative mb-8">
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center shadow-md">
                        <FileText size={42} className="text-[#2563EB]" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center">
                        <Sparkles size={13} className="text-[#2563EB]" />
                    </div>
                </div>

                <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A] mb-3">
                    Start your first analysis
                </h1>
                <p className="text-[15px] text-[#475569] max-w-md leading-relaxed mb-8">
                    Upload a contract or legal document to detect risks, analyze clauses,
                    and generate comprehensive reports — in seconds.
                </p>

                <button
                    id="empty-state-upload-btn"
                    onClick={() => navigate('/upload')}
                    className="cf-btn cf-btn-primary cf-btn-lg group"
                >
                    <Upload size={16} />
                    Upload your first document
                    <ArrowRight size={15} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 stagger">
                {features.map((f) => (
                    <div key={f.title} className="cf-card p-6 animate-fade-slide-up">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] mb-4">
                            <f.icon size={19} />
                        </div>
                        <h3 className="text-[14px] font-semibold text-[#0F172A] mb-1.5">{f.title}</h3>
                        <p className="text-[13px] text-[#64748B] leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────
   Document workspace
───────────────────────────────── */
function DocumentWorkspace({ documents }: { documents: Document[] }) {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const completed  = documents.filter((d) => d.status === 'completed');
    const analyzing  = documents.filter((d) => d.status === 'analyzing');
    const highRisk   = completed.filter((d) => d.riskLevel === 'high').length;
    const avgScore   = completed.length
        ? Math.round(completed.reduce((s, d) => s + (d.riskScore ?? 0), 0) / completed.length)
        : 0;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    const stats = [
        {
            label: 'Total Documents',
            value: documents.length,
            sub: `${analyzing.length} analyzing`,
            icon: FileText,
            color: 'text-[#2563EB]',
            bg: 'bg-[#EFF6FF]',
        },
        {
            label: 'Avg Risk Score',
            value: `${avgScore}/100`,
            sub: `across ${completed.length} docs`,
            icon: TrendingUp,
            color: avgScore >= 70 ? 'text-[#DC2626]' : avgScore >= 40 ? 'text-[#D97706]' : 'text-[#16A34A]',
            bg: avgScore >= 70 ? 'bg-[#FEF2F2]' : avgScore >= 40 ? 'bg-[#FFFBEB]' : 'bg-[#F0FDF4]',
        },
        {
            label: 'High Risk',
            value: highRisk,
            sub: 'require review',
            icon: AlertTriangle,
            color: 'text-[#DC2626]',
            bg: 'bg-[#FEF2F2]',
        },
    ];

    return (
        <div className="cf-page">
            {/* Page header */}
            <div className="flex items-start justify-between gap-4 animate-fade-slide-up">
                <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A]">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-[13px] text-[#64748B] mt-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {' · '}
                        {documents.length} document{documents.length !== 1 ? 's' : ''} in your workspace
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 animate-fade-slide-up" style={{ animationDelay: '50ms' }}>
                {stats.map((s) => (
                    <div key={s.label} className="cf-card p-4 flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', s.bg)}>
                            <s.icon size={17} className={s.color} />
                        </div>
                        <div>
                            <p className="text-[18px] font-bold text-[#0F172A] leading-tight">{s.value}</p>
                            <p className="text-[11px] text-[#94A3B8]">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Document grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-semibold text-[#0F172A]">
                        Recent Documents
                    </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
                    {documents.map((doc) => (
                        <DocumentCard key={doc.id} document={doc} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────
   Main export
───────────────────────────────── */
export default function DashboardPage() {
    const { documents, fetchDocuments, isLoading } = useDocumentStore();

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    if (isLoading) {
        return (
            <div className="cf-page">
                {/* Header skeleton */}
                <div className="animate-fade-slide-up">
                    <div className="skeleton h-7 w-64 mb-2" />
                    <div className="skeleton h-4 w-40" />
                </div>
                {/* Stats skeleton */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="cf-card p-4 flex items-center gap-3">
                            <div className="skeleton h-9 w-9 rounded-xl" />
                            <div>
                                <div className="skeleton h-5 w-16 mb-1" />
                                <div className="skeleton h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Cards skeleton */}
                <div>
                    <div className="skeleton h-5 w-40 mb-4" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="cf-card p-5 h-[200px]">
                                <div className="flex gap-3 mb-4">
                                    <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                                    <div className="flex-1">
                                        <div className="skeleton h-3 w-20 mb-2" />
                                        <div className="skeleton h-4 w-full" />
                                    </div>
                                </div>
                                <div className="skeleton h-3 w-32 mb-2" />
                                <div className="skeleton h-3 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (documents.length === 0) {
        return <EmptyState />;
    }

    return <DocumentWorkspace documents={documents} />;
}
