import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileType2, FileText, X, CheckCircle2 } from 'lucide-react';
import { cn, formatFileSize } from '@/utils/helpers';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    progress?: number;
    isUploading?: boolean;
    uploadComplete?: boolean;
}

function getFileIcon(name: string) {
    if (name.endsWith('.pdf')) return FileType2;
    return FileText;
}

export default function FileUploader({
    onFileSelect,
    accept = '.pdf,.doc,.docx,.txt',
    progress = 0,
    isUploading = false,
    uploadComplete = false,
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) { setSelectedFile(file); onFileSelect(file); }
    }, [onFileSelect]);

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setSelectedFile(file); onFileSelect(file); }
    }, [onFileSelect]);

    const FileIcon = selectedFile ? getFileIcon(selectedFile.name) : Upload;

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-14 transition-all duration-200 cursor-pointer select-none',
                    isDragging
                        ? 'border-[#2563EB] bg-[#EFF6FF] scale-[1.01]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] hover:bg-white'
                )}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
                {/* Icon */}
                <div className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-2xl mb-5 transition-colors',
                    isDragging ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-white border border-[#E2E8F0] shadow-sm text-[#94A3B8]'
                )}>
                    <Upload size={26} />
                </div>

                <p className="text-[15px] font-semibold text-[#0F172A] mb-1">
                    {isDragging ? 'Release to upload' : 'Drop your document here'}
                </p>
                <p className="text-[13px] text-[#64748B]">
                    or{' '}
                    <span className="text-[#2563EB] font-semibold hover:underline">
                        browse your files
                    </span>
                </p>
            </div>

            {/* File preview + progress */}
            {selectedFile && (
                <div className="cf-card p-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                            selectedFile.name.endsWith('.pdf')
                                ? 'bg-[#FEF2F2] text-[#DC2626]'
                                : 'bg-[#EFF6FF] text-[#2563EB]'
                        )}>
                            <FileIcon size={19} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-[#94A3B8] mt-0.5">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>

                        {uploadComplete ? (
                            <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
                        ) : !isUploading ? (
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="cf-btn cf-btn-ghost cf-btn-sm p-1.5 text-[#94A3B8] hover:text-[#DC2626]"
                            >
                                <X size={16} />
                            </button>
                        ) : null}
                    </div>

                    {/* Progress bar */}
                    {isUploading && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] text-[#64748B]">Uploading…</span>
                                <span className="text-[11px] font-semibold text-[#2563EB]">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
