import { FileText, FileType2, ExternalLink, ShieldAlert, GitCompareArrows, Download, Clock, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '@/store/documentStore';
import { cn } from '@/utils/helpers';
import type { Document } from '@/types';

interface DocumentCardProps {
    document: Document;
    className?: string;
}

function getDocIcon(type: string) {
    if (type.includes('pdf'))  return { icon: FileType2, cls: 'doc-icon-pdf' };
    if (type.includes('word') || type.includes('docx') || type.includes('doc'))
        return { icon: FileText, cls: 'doc-icon-docx' };
    return { icon: FileText, cls: 'doc-icon-txt' };
}

function getRiskBadgeClass(level?: string) {
    switch (level) {
        case 'high':   return 'cf-badge cf-badge-high';
        case 'medium': return 'cf-badge cf-badge-medium';
        case 'low':    return 'cf-badge cf-badge-low';
        default:       return 'cf-badge cf-badge-analyzing';
    }
}

function getStatusBadgeClass(status: string) {
    switch (status) {
        case 'completed': return 'cf-badge cf-badge-completed';
        case 'analyzing': return 'cf-badge cf-badge-analyzing';
        case 'error':     return 'cf-badge cf-badge-error';
        default:          return 'cf-badge cf-badge-analyzing';
    }
}

function formatDocType(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('nda') || lower.includes('non-disclosure')) return 'NDA';
    if (lower.includes('service') || lower.includes('msa'))         return 'Service Agreement';
    if (lower.includes('license') || lower.includes('software'))    return 'License Agreement';
    if (lower.includes('employment') || lower.includes('contract'))  return 'Employment Contract';
    if (lower.includes('vendor'))                                     return 'Vendor Agreement';
    if (lower.includes('partnership'))                                return 'Partnership Agreement';
    return 'Legal Document';
}

function formatRelativeDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)     return 'Just now';
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentCard({ document: doc, className }: DocumentCardProps) {
    const navigate = useNavigate();
    const { icon: DocIcon, cls: iconCls } = getDocIcon(doc.type);
    const docTypeName = formatDocType(doc.name);
    const isAnalyzing = doc.status === 'analyzing';

    return (
        <div
            className={cn(
                'cf-card cf-card-hover flex flex-col overflow-hidden cursor-default animate-fade-slide-up',
                className
            )}
        >
            {/* Card Header */}
            <div className="p-5 flex-1 relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this document?')) {
                            useDocumentStore.getState().removeDocument(doc.id);
                        }
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"
                    title="Delete document"
                >
                    <Trash2 size={15} />
                </button>
                <div className="flex items-start gap-3 pr-8">
                    {/* Doc icon */}
                    <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                        iconCls
                    )}>
                        <DocIcon size={19} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Type label */}
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-1">
                            {docTypeName}
                        </p>
                        {/* File name */}
                        <h3
                            className="text-[13px] font-semibold text-[#0F172A] leading-snug truncate"
                            title={doc.name}
                        >
                            {doc.name.replace(/\.[^.]+$/, '')}
                        </h3>
                    </div>
                </div>

                {/* Metadata row */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                    {/* Status chip */}
                    <span className={getStatusBadgeClass(doc.status)}>
                        {isAnalyzing && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-analysis-pulse" />
                        )}
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>

                    {/* Risk badge — only if completed */}
                    {doc.riskLevel && doc.status === 'completed' && (
                        <span className={getRiskBadgeClass(doc.riskLevel)}>
                            {doc.riskScore}/100 · {doc.riskLevel.charAt(0).toUpperCase() + doc.riskLevel.slice(1)}
                        </span>
                    )}
                </div>

                {/* Date / size row */}
                <div className="mt-3 flex items-center gap-4 text-[11px] text-[#94A3B8]">
                    <span className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        {formatRelativeDate(doc.uploadedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {formatFileSize(doc.size)}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#F1F5F9] mx-5" />

            {/* Quick actions */}
            <div className="flex items-center px-4 py-3 gap-1">
                {doc.status === 'completed' ? (
                    <>
                        <button
                            onClick={() => navigate('/analysis')}
                            className="cf-btn cf-btn-ghost cf-btn-sm flex-1 justify-center text-[#475569]"
                            title="Open Analysis"
                        >
                            <ExternalLink size={12} />
                            Analysis
                        </button>
                        <div className="w-px h-5 bg-[#E2E8F0]" />
                        <button
                            onClick={() => navigate('/risk')}
                            className="cf-btn cf-btn-ghost cf-btn-sm flex-1 justify-center text-[#475569]"
                            title="View Risk"
                        >
                            <ShieldAlert size={12} />
                            Risk
                        </button>
                        <div className="w-px h-5 bg-[#E2E8F0]" />
                        <button
                            onClick={() => navigate('/compare')}
                            className="cf-btn cf-btn-ghost cf-btn-sm flex-1 justify-center text-[#475569]"
                            title="Compare"
                        >
                            <GitCompareArrows size={12} />
                            Compare
                        </button>
                        <div className="w-px h-5 bg-[#E2E8F0]" />
                        <button
                            onClick={() => navigate('/report')}
                            className="cf-btn cf-btn-ghost cf-btn-sm flex-1 justify-center text-[#475569]"
                            title="Download Report"
                        >
                            <Download size={12} />
                            Report
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2 px-2 py-1 text-[12px] text-[#94A3B8]">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-analysis-pulse" />
                        {isAnalyzing ? 'Analyzing document…' : 'Pending analysis'}
                    </div>
                )}
            </div>
        </div>
    );
}
