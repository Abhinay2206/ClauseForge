import { useState, useCallback, useEffect } from 'react';
import { GitCompareArrows, X, Plus, Upload, ArrowLeftRight, FileType2, FileText, History, Clock } from 'lucide-react';
import ComparisonViewer from '@/components/ComparisonViewer';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { compareDocuments, getDocuments, getComparisonHistory, getComparisonById } from '@/services/documentService';
import { cn } from '@/utils/helpers';
import type { ComparisonResult, Document, ComparisonHistoryItem } from '@/types';

function getDocIcon(type: string) {
    if (type.includes('pdf')) return FileType2;
    return FileText;
}

function formatDocLabel(name: string) {
    return name.replace(/\.[^.]+$/, '');
}

function getRiskDotColor(level?: string) {
    if (level === 'high')   return 'bg-[#DC2626]';
    if (level === 'medium') return 'bg-[#D97706]';
    if (level === 'low')    return 'bg-[#16A34A]';
    return 'bg-[#CBD5E1]';
}

/* ────────────────────────────────
   Document Slot — select / upload
──────────────────────────────── */
function DocumentSlot({
    id,
    label,
    sublabel,
    selected,
    onSelect,
    onClear,
    onUpload,
    libraryDocs,
}: {
    id: string;
    label: string;
    sublabel: string;
    selected: Document | null;
    onSelect: (doc: Document) => void;
    onClear: () => void;
    onUpload: (file: File) => void;
    libraryDocs: Document[];
}) {
    const [dropOpen, setDropOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onUpload(file);
    }, [onUpload]);

    const DocIcon = selected ? getDocIcon(selected.type) : null;

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Slot header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">{sublabel}</p>
                    <h3 className="text-[14px] font-semibold text-[#0F172A]">{label}</h3>
                </div>
                {selected && (
                    <button
                        onClick={onClear}
                        className="cf-btn cf-btn-ghost cf-btn-sm text-[#94A3B8] hover:text-[#DC2626]"
                        title="Remove document"
                    >
                        <X size={13} />
                        Remove
                    </button>
                )}
            </div>

            {selected ? (
                /* ── Filled slot card ── */
                <div className="cf-card p-5 flex-1 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
                            selected.type.includes('pdf') ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EFF6FF] text-[#2563EB]'
                        )}>
                            {DocIcon && <DocIcon size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#0F172A] truncate" title={selected.name}>
                                {formatDocLabel(selected.name)}
                            </p>
                            <p className="text-[12px] text-[#94A3B8] mt-0.5">
                                {(selected.size / 1024).toFixed(0)} KB · PDF
                            </p>
                        </div>
                    </div>

                    {selected.riskLevel && (
                        <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', getRiskDotColor(selected.riskLevel))} />
                            <span className="text-[12px] text-[#475569]">
                                Risk Score: <strong className="text-[#0F172A]">{selected.riskScore}/100</strong>
                                {' · '}
                                <span className="capitalize">{selected.riskLevel} risk</span>
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => setDropOpen((o) => !o)}
                        className="cf-btn cf-btn-outline cf-btn-sm w-full justify-center"
                    >
                        Swap document
                    </button>

                    {/* Swap list */}
                    {dropOpen && (
                        <div className="cf-dropdown animate-scale-in">
                            <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#CBD5E1]">
                                Select from library
                            </p>
                            {libraryDocs.map((doc) => {
                                const Icon = getDocIcon(doc.type);
                                return (
                                    <button
                                        key={doc.id}
                                        onClick={() => { onSelect(doc); setDropOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                                    >
                                        <Icon size={13} className="text-[#475569] shrink-0" />
                                        <span className="flex-1 min-w-0 text-[13px] text-[#0F172A] truncate">
                                            {formatDocLabel(doc.name)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Empty slot ── */
                <div className="flex flex-col gap-3 flex-1">
                    {/* Drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            'relative flex-1 min-h-[180px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200',
                            isDragging
                                ? 'border-[#2563EB] bg-[#EFF6FF] scale-[1.01]'
                                : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] hover:bg-white'
                        )}
                    >
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] shadow-sm mb-3">
                            <Upload size={18} className="text-[#94A3B8]" />
                        </div>
                        <p className="text-[13px] font-medium text-[#475569]">Drop a file here</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">PDF, DOC, DOCX, TXT</p>
                    </div>

                    {/* Or pick from library */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E2E8F0]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-[11px] text-[#94A3B8] font-medium">
                                        or select from library
                                    </span>
                        </div>
                    </div>

                    <div className="cf-card overflow-hidden">
                        <div className="max-h-[180px] overflow-y-auto doc-scroll">
                            {libraryDocs.map((doc) => {
                                const Icon = getDocIcon(doc.type);
                                return (
                                    <button
                                        key={doc.id}
                                        id={`${id}-${doc.id}`}
                                        onClick={() => onSelect(doc)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-0 transition-colors"
                                    >
                                        <Icon size={14} className="text-[#475569] shrink-0" />
                                        <span className="flex-1 min-w-0 text-[13px] font-medium text-[#0F172A] truncate">
                                            {formatDocLabel(doc.name)}
                                        </span>
                                        {doc.riskLevel && (
                                            <span className={cn('h-2 w-2 rounded-full shrink-0', getRiskDotColor(doc.riskLevel))} />
                                        )}
                                        <Plus size={12} className="text-[#CBD5E1] shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ────────────────────────────────
   Main comparison page
──────────────────────────────── */
export default function ComparisonPage() {
    const [docA, setDocA] = useState<Document | null>(null);
    const [docB, setDocB] = useState<Document | null>(null);
    const [comparison, setComparison] = useState<ComparisonResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyList, setHistoryList] = useState<ComparisonHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        getDocuments().then(setDocuments);
    }, []);

    useEffect(() => {
        if (showHistory) {
            setIsLoadingHistory(true);
            getComparisonHistory().then(data => {
                setHistoryList(data);
                setIsLoadingHistory(false);
            });
        }
    }, [showHistory]);

    const libraryDocs = documents.filter((d) => d.status === 'completed');

    const handleCompare = async () => {
        if (!docA || !docB) return;
        setIsLoading(true);
        setComparison(null);
        const result = await compareDocuments(docA.id, docB.id);
        setComparison(result);
        setIsLoading(false);
    };

    const handleLoadHistory = async (id: string) => {
        setIsLoading(true);
        setShowHistory(false);
        setComparison(null);
        try {
            const data = await getComparisonById(id);
            setComparison(data);
            const foundA = documents.find(d => d.id === data.documentA.id);
            const foundB = documents.find(d => d.id === data.documentB.id);
            if (foundA) setDocA(foundA);
            if (foundB) setDocB(foundB);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleUploadSlot = (_file: File) => {
        // In a real app: upload and add to doc list
        // For now, no-op (mock)
    };

    const canCompare = !!(docA && docB && docA.id !== docB.id);

    return (
        <div className="cf-page">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-slide-up mb-6">
                <div>
                    <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">
                        Compare Documents
                    </h1>
                    <p className="text-[13px] text-[#64748B] mt-1">
                        Select two documents to compare them side-by-side and identify every change.
                    </p>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={cn(
                        "cf-btn cf-btn-outline transition-all",
                        showHistory && "bg-slate-100"
                    )}
                >
                    <History size={16} />
                    {showHistory ? "Back to Compare" : "History"}
                </button>
            </div>

            {/* History View */}
            {showHistory && (
                <div className="cf-card p-4 animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
                    <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">Past Comparisons</h2>
                    {isLoadingHistory ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : historyList.length === 0 ? (
                        <div className="text-center p-8 text-[#64748B]">
                            <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-[14px]">No comparison history found.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {historyList.map(item => (
                                <div key={item._id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between bg-white">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[14px] font-semibold text-slate-900 truncate" title={item.documentA.name}>{formatDocLabel(item.documentA.name)}</span>
                                            <ArrowLeftRight size={14} className="text-slate-400 shrink-0" />
                                            <span className="text-[14px] font-semibold text-slate-900 truncate" title={item.documentB.name}>{formatDocLabel(item.documentB.name)}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[12px] text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                            <span>{item.similarity}% Match</span>
                                            <span>{item.changes} changes</span>
                                        </div>
                                        {item.summary && (
                                            <p className="text-[13px] text-slate-600 mt-2 line-clamp-1">{item.summary}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleLoadHistory(item._id)}
                                        className="cf-btn cf-btn-outline cf-btn-sm shrink-0 whitespace-nowrap"
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Slot workspace */}
            {!showHistory && !comparison && !isLoading && (
                <div className="cf-card p-4 animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                        {/* Slot A */}
                        <DocumentSlot
                            id="slot-a"
                            label="Document A"
                            sublabel="Original"
                            selected={docA}
                            onSelect={setDocA}
                            onClear={() => setDocA(null)}
                            onUpload={handleUploadSlot}
                            libraryDocs={libraryDocs}
                        />

                        {/* Center divider */}
                        <div className="flex lg:flex-col items-center justify-center gap-2 shrink-0 lg:mt-8">
                            <div className="h-px lg:h-full lg:w-px w-full bg-[#E2E8F0]" />
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] shrink-0">
                                <ArrowLeftRight size={16} className="text-[#94A3B8]" />
                            </div>
                            <div className="h-px lg:h-full lg:w-px w-full bg-[#E2E8F0]" />
                        </div>

                        {/* Slot B */}
                        <DocumentSlot
                            id="slot-b"
                            label="Document B"
                            sublabel="Revised"
                            selected={docB}
                            onSelect={setDocB}
                            onClear={() => setDocB(null)}
                            onUpload={handleUploadSlot}
                            libraryDocs={libraryDocs}
                        />
                    </div>

                    {/* CTA */}
                    <div className="mt-6 flex items-center justify-between border-t border-[#F1F5F9] pt-5">
                        <p className="text-[12px] text-[#94A3B8]">
                            {!docA && !docB
                                ? 'Select both documents to begin comparison'
                                : !docA || !docB
                                ? 'Select one more document to continue'
                                : docA.id === docB.id
                                ? 'Please select two different documents'
                                : `Ready to compare ${formatDocLabel(docA.name)} vs ${formatDocLabel(docB.name)}`}
                        </p>
                        <button
                            id="compare-btn"
                            onClick={handleCompare}
                            disabled={!canCompare}
                            className="cf-btn cf-btn-primary cf-btn-lg"
                        >
                            <GitCompareArrows size={16} />
                            Run Comparison
                        </button>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="space-y-4 animate-fade-in">
                    <div className="cf-card p-4 flex items-center gap-4">
                        <div className="skeleton h-3 w-24 rounded-full" />
                        <div className="flex-1 skeleton h-2 rounded-full" />
                        <div className="skeleton h-4 w-12 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="cf-card overflow-hidden">
                            <div className="p-4 border-b border-[#F1F5F9]">
                                <div className="skeleton h-4 w-40 mb-1" />
                                <div className="skeleton h-3 w-20" />
                            </div>
                            <div className="p-4"><LoadingSkeleton lines={14} /></div>
                        </div>
                        <div className="cf-card overflow-hidden">
                            <div className="p-4 border-b border-[#F1F5F9]">
                                <div className="skeleton h-4 w-40 mb-1" />
                                <div className="skeleton h-3 w-20" />
                            </div>
                            <div className="p-4"><LoadingSkeleton lines={14} /></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {comparison && !isLoading && (
                <div className="animate-fade-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[15px] font-semibold text-[#0F172A]">Comparison Results</h2>
                        <button
                            onClick={() => { setComparison(null); setDocA(null); setDocB(null); }}
                            className="cf-btn cf-btn-outline cf-btn-sm"
                        >
                            <X size={12} />
                            New Comparison
                        </button>
                    </div>
                    <ComparisonViewer comparison={comparison} />
                </div>
            )}
        </div>
    );
}
