import { useEffect, useState, useCallback } from 'react';
import {
    Search, FileText, Trash2, ChevronLeft, ChevronRight,
    HardDrive, RefreshCw, AlertTriangle, CheckCircle2,
    Clock, XCircle, Download, FileDown, Eye, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as adminService from '@/services/adminService';
import type { AdminDocument } from '@/types';
import { cn } from '@/utils/helpers';

function formatBytes(b: number) {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    completed: { icon: <CheckCircle2 size={12} />, color: '#059669', bg: '#D1FAE5', label: 'Completed' },
    analyzing: { icon: <Clock size={12} />, color: '#2563EB', bg: '#DBEAFE', label: 'Analyzing' },
    pending:   { icon: <Clock size={12} />, color: '#D97706', bg: '#FEF3C7', label: 'Pending' },
    failed:    { icon: <XCircle size={12} />, color: '#DC2626', bg: '#FEE2E2', label: 'Failed' },
};

const RISK_STYLES: Record<string, { color: string; bg: string; border: string }> = {
    high:   { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    medium: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    low:    { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
};

function DocTypeIcon({ type }: { type: string }) {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-red-200" style={{ background: '#FEF2F2', color: '#B91C1C' }}>PDF</div>;
    if (t.includes('doc')) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>DOC</div>;
    return <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200" style={{ background: '#F8FAFC', color: '#475569' }}>TXT</div>;
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<AdminDocument[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [totalStorage, setTotalStorage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [riskFilter, setRiskFilter] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<AdminDocument | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);

    const exportAllToPDF = () => {
        const doc = new jsPDF();
        doc.text('ClauseForge - All Documents Report', 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Name', 'Owner', 'Type', 'Size', 'Status', 'Risk']],
            body: documents.map(d => [
                d.name, 
                d.user?.email || 'N/A', 
                d.type, 
                formatBytes(d.size), 
                d.status, 
                d.riskLevel || 'N/A'
            ])
        });
        doc.save('clauseforge_documents_report.pdf');
    };

    const downloadSinglePDF = (d: AdminDocument) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Document Details', 14, 15);
        doc.setFontSize(11);
        doc.text(`Name: ${d.name}`, 14, 25);
        doc.text(`Owner: ${d.user?.name || 'N/A'} (${d.user?.email || 'N/A'})`, 14, 32);
        doc.text(`Type: ${d.type}`, 14, 39);
        doc.text(`Size: ${formatBytes(d.size)}`, 14, 46);
        doc.text(`Status: ${d.status}`, 14, 53);
        doc.text(`Risk Level: ${d.riskLevel || 'None'}`, 14, 60);
        if (d.overallRiskScore !== null) {
            doc.text(`Risk Score: ${d.overallRiskScore}`, 14, 67);
        }
        doc.text(`Uploaded: ${new Date(d.createdAt).toLocaleString()}`, 14, 74);
        doc.save(`document_${d._id}.pdf`);
    };

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllDocuments({
                page, limit: 15, search,
                status: statusFilter,
                riskLevel: riskFilter
            });
            setDocuments(res.documents);
            setTotal(res.total);
            setPages(res.pages);
            setTotalStorage(res.totalStorage);
        } catch {}
        setLoading(false);
    }, [page, search, statusFilter, riskFilter]);

    useEffect(() => { loadDocuments(); }, [loadDocuments]);
    useEffect(() => { setPage(1); }, [search, statusFilter, riskFilter]);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await adminService.adminDeleteDocument(deleteConfirm._id);
            setDeleteConfirm(null);
            loadDocuments();
        } catch {}
        setDeleting(false);
    };

    const statusCounts = { completed: 0, analyzing: 0, pending: 0, failed: 0 };
    documents.forEach(d => { if (statusCounts[d.status] !== undefined) statusCounts[d.status]++; });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-slide-up">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Document Management</h1>
                    <p className="text-[13px] mt-0.5 text-[#64748B] font-medium">
                        {total.toLocaleString()} documents · {formatBytes(totalStorage)} total storage
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportAllToPDF} className="cf-btn bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] border border-[#BFDBFE] px-3 h-8 text-[12px]">
                        <FileDown size={13} /> Export PDF
                    </button>
                    <button onClick={loadDocuments} className="cf-btn cf-btn-secondary cf-btn-sm">
                        <RefreshCw size={13} className={loading ? 'animate-spin-slow' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Storage Insight Card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up stagger">
                {[
                    { label: 'Total Storage', value: formatBytes(totalStorage), icon: <HardDrive size={18} />, color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
                    { label: 'Total Documents', value: total.toLocaleString(), icon: <FileText size={18} />, color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
                    { label: 'Analyzed', value: statusCounts.completed.toString(), icon: <CheckCircle2 size={18} />, color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
                    { label: 'High Risk', value: documents.filter(d => d.riskLevel === 'high').length.toString(), icon: <AlertTriangle size={18} />, color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
                ].map(({ label, value, icon, color, bg, border }, i) => (
                    <div key={label} className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-sm animate-fade-slide-up"
                        style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                            style={{ background: bg, color, border: `1px solid ${border}` }}>
                            {icon}
                        </div>
                        <div className="text-[24px] font-bold text-[#0F172A] leading-tight mb-1">{value}</div>
                        <div className="text-[12px] font-medium text-[#64748B]">{label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-3 animate-fade-slide-up">
                <div className="relative flex-1 w-full md:w-auto min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search documents..."
                        className="cf-input !pl-9"
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cf-input w-full md:!w-40 cursor-pointer">
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="analyzing">Analyzing</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="cf-input w-full md:!w-40 cursor-pointer">
                    <option value="">All Risk</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm animate-fade-slide-up">
                {/* Header */}
                <div className="grid gap-4 px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-xl"
                    style={{ gridTemplateColumns: '2.5fr 1.5fr 0.8fr 0.8fr 1fr 1fr 0.8fr 40px' }}>
                    <span>Document</span>
                    <span>Owner</span>
                    <span>Type</span>
                    <span>Size</span>
                    <span>Status</span>
                    <span>Risk</span>
                    <span>Date</span>
                    <span />
                </div>

                {/* Rows */}
                {loading ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="grid gap-4 px-4 py-4 items-center border-b border-[#F1F5F9] last:border-0"
                            style={{ gridTemplateColumns: '2.5fr 1.5fr 0.8fr 0.8fr 1fr 1fr 0.8fr 40px' }}>
                            {[...Array(7)].map((__, j) => (
                                <div key={j} className="h-3 rounded skeleton bg-[#F1F5F9]" />
                            ))}
                        </div>
                    ))
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-[#94A3B8]">
                        <FileText size={32} className="mb-2 opacity-50" />
                        <p className="text-[13px] font-medium">No documents found</p>
                    </div>
                ) : documents.map(doc => {
                    const ss = STATUS_STYLES[doc.status] || STATUS_STYLES.pending;
                    const rs = doc.riskLevel ? RISK_STYLES[doc.riskLevel] : null;
                    return (
                        <div key={doc._id} className="grid gap-4 px-4 py-3.5 items-center hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0"
                            style={{ gridTemplateColumns: '2.5fr 1.5fr 0.8fr 0.8fr 1fr 1fr 0.8fr 40px' }}>
                            {/* Name */}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <FileText size={15} className="text-[#2563EB] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-[#0F172A] truncate">{doc.name}</p>
                                    {doc.overallRiskScore !== null && (
                                        <p className="text-[10px] font-medium text-[#64748B]">Risk score: {doc.overallRiskScore}</p>
                                    )}
                                </div>
                            </div>
                            {/* Owner */}
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-[#0F172A] truncate">{doc.user?.name || '—'}</p>
                                <p className="text-[10px] font-medium text-[#94A3B8] truncate">{doc.user?.email}</p>
                            </div>
                            {/* Type */}
                            <DocTypeIcon type={doc.type} />
                            {/* Size */}
                            <span className="text-[12px] font-medium text-[#64748B]">{formatBytes(doc.size)}</span>
                            {/* Status */}
                            <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md w-fit"
                                style={{ background: ss.bg, color: ss.color }}>
                                {ss.icon} {ss.label}
                            </div>
                            {/* Risk */}
                            {rs ? (
                                <span className="text-[11px] font-bold capitalize px-2 py-1 rounded-md border w-fit"
                                    style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}>
                                    {doc.riskLevel}
                                </span>
                            ) : <span className="text-[11px] text-[#94A3B8]">—</span>}
                            {/* Date */}
                            <span className="text-[11px] font-medium text-[#94A3B8]">
                                {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button onClick={() => setSelectedDoc(doc)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors">
                                    <Eye size={14} />
                                </button>
                                <button onClick={() => setDeleteConfirm(doc)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-[#64748B]">
                        Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] transition-all disabled:opacity-40">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[13px] font-bold text-[#0F172A] px-2">{page} / {pages}</span>
                        <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] transition-all disabled:opacity-40">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm">
                    <div className="rounded-2xl p-4 w-full max-w-sm mx-4 bg-white border border-[#E2E8F0] shadow-2xl animate-scale-in">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full mb-4 bg-red-50">
                            <Trash2 size={20} className="text-red-600" />
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] mb-1">Delete Document</h3>
                        <p className="text-[13px] mb-2 font-semibold text-[#0F172A] truncate">{deleteConfirm.name}</p>
                        <p className="text-[13px] mb-6 font-medium text-[#64748B]">
                            This will permanently delete this document. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="cf-btn cf-btn-secondary flex-1 justify-center">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="cf-btn flex-1 justify-center bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50">
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Details Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm">
                    <div className="rounded-2xl w-full max-w-lg mx-4 bg-white border border-[#E2E8F0] shadow-2xl animate-scale-in flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#0F172A]">{selectedDoc.name}</h3>
                                    <p className="text-[11px] font-medium text-[#64748B]">
                                        Uploaded {new Date(selectedDoc.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-2 text-[#94A3B8] hover:bg-[#E2E8F0] rounded-xl transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
                                    <p className="text-[11px] font-medium text-[#64748B] mb-1">Owner</p>
                                    <p className="text-[13px] font-bold text-[#0F172A]">{selectedDoc.user?.name || 'N/A'}</p>
                                    <p className="text-[11px] font-medium text-[#94A3B8]">{selectedDoc.user?.email || 'N/A'}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
                                    <p className="text-[11px] font-medium text-[#64748B] mb-1">Details</p>
                                    <p className="text-[12px] font-semibold text-[#0F172A] mb-0.5"><span className="text-[#94A3B8] font-medium">Type:</span> {selectedDoc.type}</p>
                                    <p className="text-[12px] font-semibold text-[#0F172A] mb-0.5"><span className="text-[#94A3B8] font-medium">Size:</span> {formatBytes(selectedDoc.size)}</p>
                                    <p className="text-[12px] font-semibold text-[#0F172A]"><span className="text-[#94A3B8] font-medium">Status:</span> {selectedDoc.status}</p>
                                </div>
                            </div>

                            {(selectedDoc.riskLevel || selectedDoc.overallRiskScore !== null) && (
                                <div className="p-4 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2]">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626] mb-2">Risk Analysis</p>
                                    <div className="flex gap-4">
                                        {selectedDoc.riskLevel && (
                                            <div>
                                                <p className="text-[11px] font-medium text-[#B91C1C]">Level</p>
                                                <p className="text-[14px] font-bold text-[#991B1B] capitalize">{selectedDoc.riskLevel}</p>
                                            </div>
                                        )}
                                        {selectedDoc.overallRiskScore !== null && (
                                            <div>
                                                <p className="text-[11px] font-medium text-[#B91C1C]">Score</p>
                                                <p className="text-[14px] font-bold text-[#991B1B]">{selectedDoc.overallRiskScore}/10</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center gap-3 p-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                            <button onClick={() => { setSelectedDoc(null); setDeleteConfirm(selectedDoc); }} 
                                className="cf-btn bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2]">
                                <Trash2 size={14} /> Delete
                            </button>
                            <div className="flex-1" />
                            <button onClick={() => downloadSinglePDF(selectedDoc)} 
                                className="cf-btn bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] border border-[#BFDBFE]">
                                <Download size={14} /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
