import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, FileSearch, GitCompareArrows, Download, ArrowRight, Loader2 } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { useUpload } from '@/hooks/useUpload';
import { useDocumentStore } from '@/store/documentStore';
import { useNavigate } from 'react-router-dom';
import { formatFileSize, formatDate, cn } from '@/utils/helpers';

const NEXT_ACTIONS = [
    { icon: FileSearch, label: 'Open Analysis', desc: 'View AI-detected clauses and risk score', to: '/analysis', color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]' },
    { icon: GitCompareArrows, label: 'Compare Documents', desc: 'Compare with another contract version', to: '/compare', color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
    { icon: Download, label: 'Generate Report', desc: 'Download a full analysis report', to: '/report', color: 'text-[#0891B2]', bg: 'bg-[#ECFEFF]' },
];

export default function UploadPage() {
    const { upload, progress, isUploading, uploadedDoc, reset } = useUpload();
    const { addDocument, documents, fetchDocuments } = useDocumentStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (documents.length === 0) {
            fetchDocuments();
        }
    }, [documents.length, fetchDocuments]);

    const handleFileSelect = useCallback(async (file: File) => {
        const doc = await upload(file);
        if (doc) {
            addDocument(doc);
        }
    }, [upload, addDocument]);

    // Find the live document in the store so we get real-time status updates
    const liveUploadedDoc = uploadedDoc
        ? documents.find((d) => d.id === uploadedDoc.id) || uploadedDoc
        : null;

    const isProcessing = liveUploadedDoc && (liveUploadedDoc.status === 'pending' || liveUploadedDoc.status === 'analyzing');

    const [processingMessage, setProcessingMessage] = useState('Initializing secure upload...');

    useEffect(() => {
        if (!isProcessing) return;
        
        const messages = [
            'Extracting text and metadata...',
            'Parsing document structure...',
            'Generating semantic embeddings...',
            'Running AI risk analysis...',
            'Finalizing document profile...'
        ];
        
        let index = 0;
        setProcessingMessage(messages[0]);
        
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setProcessingMessage(messages[index]);
        }, 3500);
        
        return () => clearInterval(interval);
    }, [isProcessing]);

    return (
        <div className="cf-page max-w-3xl mx-auto">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">New Document</h1>
                <p className="text-[13px] text-[#64748B] mt-1">
                    Upload a legal document for AI-powered analysis and clause detection.
                </p>
            </div>

            {/* Upload card */}
            <div className="cf-card p-6 animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
                {liveUploadedDoc ? (
                    <div className="text-center py-10">
                        <div className="flex justify-center mb-5">
                            {isProcessing ? (
                                <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="h-16 w-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center">
                                    <CheckCircle2 size={32} className="text-[#16A34A]" />
                                </div>
                            )}
                        </div>

                        <h3 className="text-[17px] font-bold text-[#0F172A] mb-2">
                            {isProcessing ? 'Processing Document...' : 'Analysis Complete!'}
                        </h3>
                        <div className="h-6 mb-8 flex items-center justify-center">
                            <p className="text-[13px] text-[#64748B] animate-fade-in key={processingMessage}">
                                {isProcessing
                                    ? processingMessage
                                    : 'Your document has been successfully processed and stored. What would you like to do next?'}
                            </p>
                        </div>

                        {/* What's next - only show when processing is done */}
                        {!isProcessing && (
                            <div className="text-left animate-fade-slide-up">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-3 text-center">
                                    What would you like to do?
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {NEXT_ACTIONS.map((action) => (
                                        <button
                                            key={action.to}
                                            onClick={() => navigate(action.to)}
                                            className="cf-card cf-card-hover p-4 text-left group"
                                        >
                                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl mb-3', action.bg)}>
                                                <action.icon size={17} className={action.color} />
                                            </div>
                                            <p className="text-[13px] font-semibold text-[#0F172A] mb-1">
                                                {action.label}
                                            </p>
                                            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                                                {action.desc}
                                            </p>
                                            <ArrowRight size={13} className={cn('mt-2 transition-transform group-hover:translate-x-1', action.color)} />
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <button
                                        onClick={reset}
                                        className="cf-btn cf-btn-outline mt-6 mx-auto"
                                    >
                                        <Upload size={14} />
                                        Upload another document
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <FileUploader
                        onFileSelect={handleFileSelect}
                        progress={progress}
                        isUploading={isUploading}
                        uploadComplete={!!uploadedDoc}
                    />
                )}
            </div>

            {/* Supported formats info */}
            {!uploadedDoc && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[#94A3B8] animate-fade-in px-1">
                    <span>Supported: <strong className="text-[#64748B]">PDF, DOC, DOCX, TXT</strong></span>
                    <span>Max size: <strong className="text-[#64748B]">50 MB</strong></span>
                    <span>OCR: <strong className="text-[#64748B]">Included for scanned docs</strong></span>
                </div>
            )}

            {/* Upload history */}
            {documents.length > 0 && (
                <div className="cf-card overflow-hidden animate-fade-slide-up">
                    <div className="cf-section-header">
                        <p className="cf-section-title">Recent Uploads</p>
                        <span className="text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
                            {Math.min(documents.length, 5)}
                        </span>
                    </div>
                    <div className="divide-y divide-[#F8FAFC]">
                        {documents.slice(0, 5).map((doc) => {
                            const isSuccess = doc.status === 'completed' || doc.status === 'analyzing' || doc.status === 'pending';
                            return (
                                <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <div className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                                        isSuccess ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                                    )}>
                                        {isSuccess ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[#0F172A] truncate">{doc.name}</p>
                                        <p className="text-[11px] text-[#94A3B8]">
                                            {formatFileSize(doc.size)} · {formatDate(doc.uploadedAt)}
                                        </p>
                                    </div>
                                    <span className={isSuccess ? (doc.status === 'completed' ? 'cf-badge cf-badge-completed' : 'cf-badge cf-badge-analyzing') : 'cf-badge cf-badge-error'}>
                                        {isSuccess ? (doc.status === 'completed' ? 'Analyzed' : 'Processing') : 'Failed'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
