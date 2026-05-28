import { useEffect, useState, useCallback, useRef } from 'react';
import { Download, FileText, Sparkles, Loader2, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import DocumentSelector from '@/components/DocumentSelector';
import { getReport, generateDocumentReport } from '@/services/documentService';
import { formatClauseType, formatDate, cn } from '@/utils/helpers';
import { useDocumentStore } from '@/store/documentStore';
import type { Report, Document } from '@/types';
import ReactMarkdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';

export default function ReportPage() {
    const { documents } = useDocumentStore();
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [report, setReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const loadReport = useCallback(async (docId: string) => {
        setIsLoading(true);
        try {
            const data = await getReport(docId);
            setReport(data);
        } catch (error) {
            console.error("Failed to load report", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedDoc && documents.length > 0) {
            setSelectedDoc(documents[0]);
        }
    }, [documents, selectedDoc]);

    useEffect(() => {
        if (selectedDoc) {
            loadReport(selectedDoc.id);
        }
    }, [selectedDoc, loadReport]);

    const handleGenerate = async () => {
        if (!selectedDoc) return;
        setIsGenerating(true);
        try {
            const data = await generateDocumentReport(selectedDoc.id);
            setReport(data);
        } catch (error) {
            console.error("Failed to generate report", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `clauseforge-report-${selectedDoc?.id || 'document'}`,
    });

    return (
        <div className="cf-page max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-slide-up">
                <div>
                    <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A] mb-3">
                        Analysis Report
                    </h1>
                    <DocumentSelector
                        selectedId={selectedDoc?.id || ''}
                        onSelect={setSelectedDoc}
                        label="Report for"
                    />
                </div>
                {report?.fullAiReport && !isLoading && selectedDoc && (
                    <button
                        id="report-download-btn"
                        onClick={handleDownloadPDF}
                        className="cf-btn cf-btn-outline shrink-0 sm:mt-7"
                    >
                        <Download size={14} />
                        Download PDF
                    </button>
                )}
            </div>

            {!selectedDoc ? (
                <div className="cf-card p-12 text-center text-gray-500 mt-6 animate-fade-slide-up">
                    Please upload or select a document to view its report.
                </div>
            ) : isLoading ? (
                <div className="space-y-4 mt-6">
                    <div className="cf-card p-6"><LoadingSkeleton lines={15} /></div>
                </div>
            ) : report?.fullAiReport ? (
                <div className="space-y-6 print:m-8" ref={reportRef}>
                    <div className="cf-card overflow-hidden animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
                        <div className="cf-section-header">
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-[#2563EB]" />
                                <p className="cf-section-title">Full AI Report</p>
                            </div>
                            <span className="text-[11px] text-[#94A3B8]">
                                Generated {formatDate(report.generatedAt)}
                            </span>
                        </div>
                        <div className="p-8">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">ClauseForge Analysis Report</h1>
                                <p className="text-sm text-gray-500">Document: {report.documentName}</p>
                                <p className="text-sm text-gray-500">Generated: {formatDate(report.generatedAt)}</p>
                            </div>
                            
                            <div className="text-[14px] text-[#334155] leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-gray-800 mt-5 mb-2" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2" {...props} />,
                                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                                        li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 mb-4" {...props} />
                                    }}
                                >
                                    {report.fullAiReport}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Clause Analysis Table */}
                    {report.clauseAnalysis && report.clauseAnalysis.length > 0 && (
                        <div className="cf-card overflow-hidden animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
                            <div className="cf-section-header">
                                <p className="cf-section-title">Clause Detections</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Clause Type</th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Count</th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#16A34A]">
                                                <span className="flex items-center justify-center gap-1">
                                                    <CheckCircle2 size={12} /> Low
                                                </span>
                                            </th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">
                                                <span className="flex items-center justify-center gap-1">
                                                    <ShieldAlert size={12} /> Medium
                                                </span>
                                            </th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#DC2626]">
                                                <span className="flex items-center justify-center gap-1">
                                                    <AlertTriangle size={12} /> High
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.clauseAnalysis.map((ca, i) => (
                                            <tr
                                                key={ca.type}
                                                className={cn(
                                                    'border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors',
                                                    i % 2 === 0 ? '' : 'bg-[#FAFBFC]'
                                                )}
                                            >
                                                <td className="px-6 py-3.5 font-medium text-[#0F172A]">
                                                    {formatClauseType(ca.type)}
                                                </td>
                                                <td className="px-6 py-3.5 text-center text-[#64748B]">{ca.count}</td>
                                                <td className="px-6 py-3.5 text-center">
                                                    {ca.riskBreakdown.low > 0 && (
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F0FDF4] text-[11px] font-bold text-[#16A34A]">
                                                            {ca.riskBreakdown.low}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    {ca.riskBreakdown.medium > 0 && (
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFFBEB] text-[11px] font-bold text-[#D97706]">
                                                            {ca.riskBreakdown.medium}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    {ca.riskBreakdown.high > 0 && (
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FEF2F2] text-[11px] font-bold text-[#DC2626]">
                                                            {ca.riskBreakdown.high}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Risk Insights */}
                    {report.riskInsights && report.riskInsights.length > 0 && (
                        <div className="cf-card overflow-hidden animate-fade-slide-up" style={{ animationDelay: '140ms' }}>
                            <div className="cf-section-header">
                                <p className="cf-section-title">Risk Analysis</p>
                                <span className="text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
                                    {report.riskInsights.length}
                                </span>
                            </div>
                            <div className="p-5 space-y-3">
                                {report.riskInsights.map((insight, i) => {
                                    const isHigh = i < 2;
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                'flex items-start gap-3 rounded-lg p-4',
                                                isHigh ? 'bg-[#FEF2F2]' : 'bg-[#FFFBEB]'
                                            )}
                                        >
                                            <span className={cn(
                                                'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0',
                                                isHigh
                                                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                                                    : 'bg-[#FDE68A] text-[#92400E]'
                                            )}>
                                                {i + 1}
                                            </span>
                                            <p className={cn(
                                                'text-[13px] leading-relaxed',
                                                isHigh ? 'text-[#7F1D1D]' : 'text-[#78350F]'
                                            )}>
                                                {insight}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="cf-card overflow-hidden animate-fade-slide-up p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Sparkles size={24} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Report Generated</h3>
                    <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
                        Generate a comprehensive, easy-to-understand breakdown of the entire document's clauses and risks using our advanced LLM.
                    </p>
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="cf-btn cf-btn-primary"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Generate AI Report
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
