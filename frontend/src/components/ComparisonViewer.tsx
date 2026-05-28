import type { ComparisonResult } from '@/types';
import { cn } from '@/utils/helpers';
import { ShieldAlert, CheckCircle2, MinusCircle, FileText } from 'lucide-react';

interface ComparisonViewerProps {
    comparison: ComparisonResult;
}

function getRelationshipIcon(relationship: string) {
    switch (relationship) {
        case 'similar':
            return <CheckCircle2 size={14} className="text-[#16A34A]" />;
        case 'conflicting':
            return <ShieldAlert size={14} className="text-[#DC2626]" />;
        default:
            return <MinusCircle size={14} className="text-[#94A3B8]" />;
    }
}

function getRelationshipBadge(relationship: string) {
    switch (relationship) {
        case 'similar':
            return 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]';
        case 'conflicting':
            return 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
        default:
            return 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]';
    }
}

export default function ComparisonViewer({ comparison }: ComparisonViewerProps) {
    const similarityColor =
        comparison.similarity >= 80 ? 'text-[#16A34A]' :
        comparison.similarity >= 50 ? 'text-[#D97706]' :
        'text-[#DC2626]';

    return (
        <div className="space-y-6">
            {/* Stats header */}
            <div className="cf-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                            Semantic Comparison
                            <span className="cf-badge bg-blue-50 text-blue-600 border border-blue-200">AI Powered</span>
                        </h3>
                        <p className="text-[13px] text-[#64748B] mt-1">{comparison.summary}</p>
                    </div>
                    <div className="flex items-center gap-6 sm:border-l sm:border-[#E2E8F0] sm:pl-6">
                        <div className="text-center">
                            <p className={cn("text-[24px] font-bold", similarityColor)}>
                                {comparison.similarity}%
                            </p>
                            <p className="text-[11px] text-[#94A3B8] uppercase tracking-widest font-semibold">Similarity</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Headers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sticky top-0 z-10">
                <div className="cf-card px-4 py-3 bg-[#F8FAFC] shadow-sm flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] shrink-0">
                        <FileText size={14} className="text-[#64748B]" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#94A3B8]">Document A</p>
                        <p className="text-[13px] font-bold text-[#0F172A] truncate">{comparison.documentA.name}</p>
                    </div>
                </div>
                <div className="cf-card px-4 py-3 bg-[#F8FAFC] shadow-sm flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] shrink-0">
                        <FileText size={14} className="text-[#64748B]" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#94A3B8]">Document B</p>
                        <p className="text-[13px] font-bold text-[#0F172A] truncate">{comparison.documentB.name}</p>
                    </div>
                </div>
            </div>

            {/* Clause Comparisons */}
            <div className="space-y-4">
                {comparison.clauseComparisons?.map((cc, i) => (
                    <div key={i} className="cf-card overflow-hidden animate-fade-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                        
                        {/* Clause Header & Relationship */}
                        <div className="px-5 py-3 border-b border-[#F1F5F9] bg-white flex items-center justify-between">
                            <p className="text-[13px] font-bold text-[#0F172A] flex items-center gap-2">
                                {cc.clause_type} Clause
                            </p>
                            <span className={cn('cf-badge border px-2.5 py-1', getRelationshipBadge(cc.relationship))}>
                                {getRelationshipIcon(cc.relationship)}
                                <span className="capitalize font-semibold">{cc.relationship}</span>
                            </span>
                        </div>

                        {/* Side-by-side text */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F1F5F9]">
                            <div className="p-5 bg-[#FAFAFA]">
                                <p className="text-[13px] leading-relaxed text-[#334155] whitespace-pre-wrap">{cc.text_a}</p>
                            </div>
                            <div className="p-5 bg-[#FAFAFA]">
                                <p className="text-[13px] leading-relaxed text-[#334155] whitespace-pre-wrap">{cc.text_b}</p>
                            </div>
                        </div>

                        {/* AI Explanation (Groq LLaMA) */}
                        <div className="px-5 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-1">AI Analysis</p>
                            <p className="text-[13px] leading-relaxed text-[#0F172A] font-medium">{cc.explanation}</p>
                        </div>
                    </div>
                ))}


                {/* Text Diff Fallback */}
                {(!comparison.clauseComparisons || comparison.clauseComparisons.length === 0) && comparison.diffA?.length > 0 && (
                    <div className="cf-card overflow-hidden animate-fade-slide-up">
                        <div className="px-5 py-3 border-b border-[#F1F5F9] bg-white flex items-center justify-between">
                            <p className="text-[13px] font-bold text-[#0F172A] flex items-center gap-2">
                                Standard Text Comparison
                            </p>
                            <span className="cf-badge border px-2.5 py-1 bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]">
                                <FileText size={14} className="text-[#94A3B8]" />
                                <span className="capitalize font-semibold">Line by Line</span>
                            </span>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F1F5F9]">
                            <div className="p-5 bg-[#FAFAFA] font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap">
                                {comparison.diffA.map((part, i) => (
                                    <span key={i} className={cn(
                                        part.type === 'removed' ? 'bg-[#FECACA] text-[#DC2626] font-semibold' : 'text-[#334155]'
                                    )}>
                                        {part.text}
                                    </span>
                                ))}
                            </div>
                            <div className="p-5 bg-[#FAFAFA] font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap">
                                {comparison.diffB.map((part, i) => (
                                    <span key={i} className={cn(
                                        part.type === 'added' ? 'bg-[#BBF7D0] text-[#16A34A] font-semibold' : 'text-[#334155]'
                                    )}>
                                        {part.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {(!comparison.clauseComparisons || comparison.clauseComparisons.length === 0) && (!comparison.diffA || comparison.diffA.length === 0) && (
                    <div className="cf-card p-10 text-center">
                        <ShieldAlert size={24} className="mx-auto text-[#CBD5E1] mb-3" />
                        <h3 className="text-[15px] font-semibold text-[#0F172A]">No Matching Clauses Found</h3>
                        <p className="text-[13px] text-[#64748B] mt-1">
                            The AI could not find clauses of the same type to compare between these two documents.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
