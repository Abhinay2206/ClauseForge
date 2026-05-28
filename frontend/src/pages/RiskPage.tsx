import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import DocumentSelector from '@/components/DocumentSelector';
import { getAnalysis } from '@/services/documentService';
import { getRiskColor, cn } from '@/utils/helpers';
import { useDocumentStore } from '@/store/documentStore';
import type { AnalysisResult, Document } from '@/types';

function RiskScoreRing({ score, level }: { score: number; level: string }) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;
    const ringColor =
        score >= 70 ? '#DC2626' :
        score >= 40 ? '#D97706' :
        '#16A34A';

    return (
        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="8" />
            {/* Score arc */}
            <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
            {/* Center text — rotated back */}
            <g transform="rotate(90, 60, 60)">
                <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="700" fill="#0F172A" fontFamily="Inter, sans-serif">
                    {score}
                </text>
                <text x="60" y="72" textAnchor="middle" fontSize="11" fill="#94A3B8" fontFamily="Inter, sans-serif">
                    / 100
                </text>
            </g>
        </svg>
    );
}

function RiskItem({ risk }: { risk: { id: string; category: string; description: string; severity: string; recommendation: string } }) {
    const [expanded, setExpanded] = useState(false);
    const colors = getRiskColor(risk.severity as any);

    const borderMap: Record<string, string> = {
        high:   'border-l-[#DC2626]',
        medium: 'border-l-[#D97706]',
        low:    'border-l-[#16A34A]',
    };

    return (
        <div className={cn('border-l-4 pl-4 py-3', borderMap[risk.severity] || 'border-l-[#E2E8F0]')}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[13px] font-semibold text-[#0F172A]">{risk.category}</h4>
                        <RiskBadge level={risk.severity as any} size="sm" />
                    </div>
                    <p className="text-[12px] text-[#475569] leading-relaxed">{risk.description}</p>
                </div>
                <button
                    onClick={() => setExpanded((e) => !e)}
                    className="cf-btn cf-btn-ghost cf-btn-sm shrink-0 text-[#94A3B8] hover:text-[#475569]"
                >
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
            </div>

            {expanded && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#EFF6FF] p-3 animate-fade-in">
                    <Info size={13} className="text-[#2563EB] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#1E40AF] leading-relaxed">
                        <strong>Recommendation:</strong> {risk.recommendation}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function RiskPage() {
    const { documents, fetchDocuments } = useDocumentStore();
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadAnalysis = useCallback(async (docId: string) => {
        setIsLoading(true);
        const data = await getAnalysis(docId);
        setAnalysis(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (documents.length === 0) {
            fetchDocuments();
        }
    }, [documents.length, fetchDocuments]);

    useEffect(() => {
        if (documents.length > 0 && !selectedDoc) {
            setSelectedDoc(documents[0]);
        }
    }, [documents, selectedDoc]);

    useEffect(() => {
        if (selectedDoc) {
            loadAnalysis(selectedDoc.id);
        }
    }, [selectedDoc?.id, loadAnalysis]);

    const handleDocSelect = (doc: Document) => {
        setSelectedDoc(doc);
    };

    const highCount   = analysis?.risks?.filter((r) => r.severity === 'high').length   ?? 0;
    const medCount    = analysis?.risks?.filter((r) => r.severity === 'medium').length ?? 0;
    const lowCount    = analysis?.risks?.filter((r) => r.severity === 'low').length    ?? 0;

    return (
        <div className="cf-page">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A] mb-3">
                    Risk Analysis
                </h1>
                {selectedDoc && (
                    <DocumentSelector
                        selectedId={selectedDoc.id}
                        onSelect={handleDocSelect}
                        label="Analyzing"
                    />
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="cf-card p-5 flex gap-5 items-center">
                        <div className="skeleton h-40 w-40 rounded-full shrink-0" />
                        <div className="flex-1">
                            <div className="skeleton h-6 w-48 mb-3" />
                            <div className="skeleton h-4 w-full mb-2" />
                            <div className="skeleton h-4 w-3/4" />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[1, 2, 3].map((i) => <LoadingSkeleton key={i} variant="card" />)}
                    </div>
                </div>
            ) : analysis ? (
                <>
                    {/* Score card */}
                    <div className="cf-card p-5 animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <RiskScoreRing score={analysis.overallRiskScore} level={analysis.riskLevel} />
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                                    <h2 className="text-[18px] font-bold text-[#0F172A]">Overall Risk Score</h2>
                                    <RiskBadge level={analysis.riskLevel} />
                                </div>
                                <p className="text-[14px] text-[#475569] leading-relaxed max-w-lg">
                                    {analysis.summary}
                                </p>
                                {/* Mini summary stats */}
                                <div className="flex items-center gap-4 mt-4 justify-center sm:justify-start">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                                        <span className="text-[12px] text-[#475569]">{highCount} High</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                                        <span className="text-[12px] text-[#475569]">{medCount} Medium</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                                        <span className="text-[12px] text-[#475569]">{lowCount} Low</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Count cards */}
                    <div className="grid gap-3 sm:grid-cols-3 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
                        {[
                            { count: highCount, label: 'High Risk Issues', icon: AlertTriangle, color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]' },
                            { count: medCount,  label: 'Medium Risk Issues', icon: ShieldAlert,  color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]' },
                            { count: lowCount,  label: 'Low Risk Issues',   icon: CheckCircle2, color: 'text-[#16A34A]', bg: 'bg-[#F0FDF4]' },
                        ].map((item) => (
                            <div key={item.label} className="cf-card p-4 flex items-center gap-4">
                                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', item.bg)}>
                                    <item.icon size={20} className={item.color} />
                                </div>
                                <div>
                                    <p className={cn('text-[22px] font-bold leading-tight', item.color)}>{item.count}</p>
                                    <p className="text-[12px] text-[#94A3B8]">{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Risk breakdown */}
                    <div className="cf-card overflow-hidden animate-fade-slide-up" style={{ animationDelay: '140ms' }}>
                        <div className="cf-section-header">
                            <p className="cf-section-title">Risk Breakdown</p>
                            <span className="text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
                                {analysis.risks ? analysis.risks.length : 0} issues
                            </span>
                        </div>
                        <div className="divide-y divide-[#F8FAFC] px-4 py-2 space-y-1">
                            {analysis.risks && analysis.risks.map((risk) => (
                                <RiskItem key={risk.id} risk={risk} />
                            ))}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
