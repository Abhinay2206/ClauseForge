import { useEffect, useState, useCallback } from 'react';
import { FileSearch, ChevronRight, Copy, Check, BookOpen, Download, Loader2 } from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import DocumentSelector from '@/components/DocumentSelector';
import { getAnalysis, explainClause, generateDocumentReport } from '@/services/documentService';
import { formatClauseType, getRiskColor, cn } from '@/utils/helpers';
import { useDocumentStore } from '@/store/documentStore';
import type { AnalysisResult, Clause, Document } from '@/types';

const CLAUSE_TYPE_ICONS: Record<string, string> = {
    'Terminations':          '⚖️',
    'Liability':             '🛡️',
    'Indemnifications':      '🔐',
    'Confidentiality':       '🔒',
    'Non-Compete':           '🚫',
    'Payments':              '💳',
    'Intellectual Property': '💡',
    'Governing Laws':        '🏛️',
    'Force Majeure':         '⚡',
    'Dispute Resolution':    '🤝',
    'Arbitration':           '⚖️',
    'Warranties':            '🛡️',
    'Assigns':               '📝',
    'Amendments':            '✍️',
    'Notices':               '📬',
    'Representations':       '🗣️',
    'Compliance With Laws':  '📚',
};

const DOC_TEXT = `MASTER SERVICE AGREEMENT

This Master Service Agreement ("Agreement") is entered into as of March 1, 2026, by and between TechCorp Inc. ("Client") and ServicePro LLC ("Provider").

1. TERMINATION CLAUSE
Either party may terminate this Agreement upon 30 days written notice. However, the Client reserves the right to terminate immediately without notice if the Provider fails to meet performance benchmarks for two consecutive quarters. In the event of early termination by the Provider, a penalty of 25% of the remaining contract value shall be payable.

2. LIABILITY AND INDEMNIFICATION
The Provider shall indemnify the Client against all losses, damages, and expenses arising from the Provider's negligence or willful misconduct. The total aggregate liability under this agreement shall not exceed 200% of the fees paid in the twelve months preceding the claim. Neither party shall be liable for consequential, indirect, or punitive damages.

3. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all proprietary information shared during the term of this Agreement and for a period of five (5) years following termination. Confidential information includes trade secrets, business plans, customer data, and financial records.

4. NON-COMPETE
The Provider agrees not to engage in any business that directly competes with the Client's core offerings for a period of two (2) years after the termination of this Agreement, within any jurisdiction where the Client operates. This restriction applies to all employees and subcontractors of the Provider.

5. PAYMENT TERMS
The Client shall pay all invoices within Net 45 days. Late payments shall incur interest at 1.5% per month. The Provider may suspend services if payment is overdue by more than 60 days. All fees are non-refundable once services have been commenced.

6. INTELLECTUAL PROPERTY
All intellectual property developed during the provision of services shall be the exclusive property of the Client. The Provider retains no rights to any work product created under this Agreement.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws provisions.

8. FORCE MAJEURE
Neither party shall be liable for delays or failure to perform due to causes beyond their reasonable control, including natural disasters, pandemics, government actions, or cyber attacks.

9. DISPUTE RESOLUTION
Any disputes arising under this Agreement shall first be submitted to mediation. If mediation fails within 60 days, the dispute shall be resolved through binding arbitration in Wilmington, Delaware.`;

export default function AnalysisPage() {
    const { documents, fetchDocuments } = useDocumentStore();
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
    const [dynamicExplanation, setDynamicExplanation] = useState<string>('');
    const [isExplaining, setIsExplaining] = useState<boolean>(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [copied, setCopied] = useState(false);

    const loadAnalysis = useCallback(async (docId: string) => {
        setIsLoading(true);
        setSelectedClause(null);
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

    useEffect(() => {
        if (selectedClause) {
            setIsExplaining(true);
            setDynamicExplanation('');
            explainClause(selectedClause.text, selectedClause.type, selectedClause.riskLevel)
                .then(setDynamicExplanation)
                .catch(() => setDynamicExplanation(selectedClause.explanation))
                .finally(() => setIsExplaining(false));
        }
    }, [selectedClause]);

    const handleCopy = () => {
        if (selectedClause) {
            navigator.clipboard.writeText(selectedClause.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadReport = async () => {
        if (!selectedDoc) return;
        setIsGeneratingReport(true);
        try {
            const reportText = await generateDocumentReport(selectedDoc.id);
            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedDoc.name}_AI_Report.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to generate the AI report. Please try again.');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const renderHighlightedText = () => {
        if (!analysis || !analysis.clauses.length) {
            return DOC_TEXT; // fallback
        }
        
        // Build the text from the chunks that the clauses refer to, or just display clauses since we don't have the full text assembled yet.
        // For simplicity in this UI, we can just join all clause texts if we don't have the full original text.
        // Or if we want to display properly, we should use the assembled full text. But we only have `totalChunks`.
        // Let's just render the clauses as a stream of text for now, separated by double newlines, 
        // as the RAG chunks cover the whole document.
        
        const parts: { text: string; clause?: Clause }[] = [];
        
        // Sort clauses by start index
        const sorted = [...analysis.clauses].sort((a, b) => a.startIndex - b.startIndex);
        
        sorted.forEach((clause) => {
            parts.push({ text: clause.text, clause });
            parts.push({ text: '\n\n' }); // separation
        });

        return parts.map((part, i) => {
            if (part.clause) {
                const colors = getRiskColor(part.clause.riskLevel);
                const isSelected = selectedClause?.id === part.clause.id;
                const underlineColor =
                    part.clause.riskLevel === 'high'   ? 'border-[#DC2626]' :
                    part.clause.riskLevel === 'medium' ? 'border-[#D97706]' :
                    'border-[#16A34A]';
                return (
                    <span
                        key={i}
                        onClick={() => setSelectedClause(part.clause!)}
                        className={cn(
                            'cursor-pointer rounded-sm px-0.5 border-b-2 transition-all duration-150',
                            colors.bg,
                            underlineColor,
                            isSelected && 'ring-2 ring-[#2563EB] ring-offset-1 rounded'
                        )}
                    >
                        {part.text}
                    </span>
                );
            }
            return <span key={i}>{part.text}</span>;
        });
    };

    return (
        <div className="cf-page">
            {/* ── Top bar: doc selector + summary ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-slide-up">
                <div className="flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A] mb-3">
                        Document Analysis
                    </h1>
                    {selectedDoc && (
                        <DocumentSelector
                            selectedId={selectedDoc.id}
                            onSelect={handleDocSelect}
                            label="Analyzing"
                        />
                    )}
                </div>

                {analysis && !isLoading && (
                    <div className="flex items-center gap-3 shrink-0 mt-1 sm:mt-7">
                        <RiskBadge level={analysis.riskLevel} />
                        <span className="text-[13px] font-bold text-[#0F172A]">
                            {analysis.overallRiskScore}
                            <span className="text-[#94A3B8] font-normal">/100</span>
                        </span>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2"><LoadingSkeleton lines={22} /></div>
                    <div className="space-y-4">
                        <LoadingSkeleton lines={8} />
                        <LoadingSkeleton lines={6} />
                    </div>
                </div>
            ) : analysis ? (
                <>
                    {/* Analysis summary banner */}
                    <div className="cf-card p-4 border-l-4 border-l-[#D97706] bg-[#FFFBEB] animate-fade-slide-up" style={{ animationDelay: '80ms' }}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <FileSearch size={16} className="text-[#D97706] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[13px] font-semibold text-[#92400E] mb-1">AI Analysis Summary</p>
                                    <p className="text-[13px] text-[#78350F] leading-relaxed">{analysis.summary}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                disabled={isGeneratingReport}
                                className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D97706] text-[#92400E] rounded-md text-[12px] font-semibold hover:bg-[#FEF3C7] transition-colors disabled:opacity-50"
                            >
                                {isGeneratingReport ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={14} />
                                        Download Full AI Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Main 3-column layout */}
                    <div className="grid gap-5 lg:grid-cols-3 animate-fade-slide-up" style={{ animationDelay: '120ms' }}>
                        {/* Document viewer — 2 cols */}
                        <div className="lg:col-span-2 cf-card overflow-hidden flex flex-col">
                            <div className="cf-section-header bg-[#F8FAFC]">
                                <div>
                                    <p className="cf-section-title flex items-center gap-2">
                                        <BookOpen size={13} className="text-[#94A3B8]" />
                                        Document Content
                                    </p>
                                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                                        Click highlighted clauses to inspect
                                    </p>
                                </div>
                                <span className="cf-badge cf-badge-completed">
                                    {analysis.clauses.length} clauses detected
                                </span>
                            </div>
                            <div className="p-4 text-[13px] leading-7 whitespace-pre-wrap text-[#334155] max-h-[600px] overflow-y-auto doc-scroll font-[system-ui] tracking-normal">
                                {renderHighlightedText()}
                            </div>
                        </div>

                        {/* Right sidebar */}
                        <div className="space-y-4">
                            {/* Clause detail panel */}
                            {selectedClause ? (
                                <div className="cf-card p-5 space-y-4 animate-scale-in">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">
                                                {CLAUSE_TYPE_ICONS[selectedClause.type] || '📄'}{' '}
                                                {formatClauseType(selectedClause.type)}
                                            </p>
                                            <RiskBadge level={selectedClause.riskLevel} size="sm" />
                                        </div>
                                        <h3 className="text-[13px] font-semibold text-[#0F172A]">
                                            Clause Details
                                        </h3>
                                    </div>

                                    {/* Clause text */}
                                    <div className="relative rounded-lg bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                                        <p className="text-[12px] text-[#475569] italic leading-relaxed pr-6">
                                            "{selectedClause.text}"
                                        </p>
                                        <button
                                            onClick={handleCopy}
                                            className="absolute top-2 right-2 p-1 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-white transition-colors"
                                            title="Copy clause text"
                                        >
                                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                        </button>
                                    </div>

                                    {/* Explanation */}
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-2">
                                            Why this matters
                                        </p>
                                        <p className="text-[13px] text-[#475569] leading-relaxed">
                                            {isExplaining ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-3 h-3 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></span>
                                                    <span className="text-[#94A3B8]">AI is analyzing this clause...</span>
                                                </span>
                                            ) : (
                                                dynamicExplanation || selectedClause.explanation
                                            )}
                                        </p>
                                    </div>
                                    
                                    {/* Confidence Scores */}
                                    <div className="pt-2 border-t border-[#E2E8F0] flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Clause Confidence</p>
                                            <p className="text-[12px] font-semibold text-[#334155]">{(selectedClause.confidence * 100).toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Risk Confidence</p>
                                            <p className="text-[12px] font-semibold text-[#334155]">{(selectedClause.riskConfidence * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="cf-card p-4 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] mx-auto mb-3">
                                        <FileSearch size={22} className="text-[#CBD5E1]" />
                                    </div>
                                    <p className="text-[13px] font-medium text-[#475569]">
                                        Click a highlighted clause
                                    </p>
                                    <p className="text-[12px] text-[#94A3B8] mt-1">
                                        to see risk details and recommendations
                                    </p>
                                </div>
                            )}

                            {/* All clauses list */}
                            <div className="cf-card overflow-hidden">
                                <div className="cf-section-header">
                                    <p className="cf-section-title">All Clauses</p>
                                    <span className="text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
                                        {analysis.clauses.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-[#F1F5F9] max-h-72 overflow-y-auto doc-scroll">
                                    {analysis.clauses.map((clause) => {
                                        const colors = getRiskColor(clause.riskLevel);
                                        const isActive = selectedClause?.id === clause.id;
                                        return (
                                            <button
                                                key={clause.id}
                                                onClick={() => setSelectedClause(clause)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                                    isActive
                                                        ? 'bg-[#EFF6FF]'
                                                        : 'hover:bg-[#F8FAFC]'
                                                )}
                                            >
                                                <span className="text-base shrink-0">
                                                    {CLAUSE_TYPE_ICONS[clause.type] || '📄'}
                                                </span>
                                                <span className={cn(
                                                    'flex-1 text-[12px] font-medium truncate',
                                                    isActive ? 'text-[#2563EB]' : 'text-[#0F172A]'
                                                )}>
                                                    {formatClauseType(clause.type)}
                                                </span>
                                                <span className={cn('h-2 w-2 rounded-full shrink-0', colors.dot)} />
                                                <ChevronRight size={13} className="text-[#CBD5E1] shrink-0" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
