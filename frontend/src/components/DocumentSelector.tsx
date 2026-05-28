import { useState, useRef, useEffect, useCallback } from 'react';
import {
    ChevronDown,
    FileType2,
    FileText,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import { useDocumentStore } from '@/store/documentStore';
import type { Document } from '@/types';

interface DocumentSelectorProps {
    selectedId: string;
    onSelect: (doc: Document) => void;
    label?: string;
}

function getDocIcon(type: string) {
    if (type.includes('pdf')) return FileType2;
    return FileText;
}

function getRiskDot(level?: string) {
    switch (level) {
        case 'high':   return 'bg-[#DC2626]';
        case 'medium': return 'bg-[#D97706]';
        case 'low':    return 'bg-[#16A34A]';
        default:       return 'bg-[#94A3B8]';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'completed': return <CheckCircle2 size={12} className="text-[#16A34A]" />;
        case 'analyzing': return <Clock size={12} className="text-[#2563EB] animate-spin-slow" />;
        case 'error':     return <AlertTriangle size={12} className="text-[#DC2626]" />;
        default:          return <Clock size={12} className="text-[#94A3B8]" />;
    }
}

function formatDocLabel(name: string): string {
    return name.replace(/\.[^.]+$/, '');
}

function formatRelDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7)   return `${diff}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DocumentSelector({
    selectedId,
    onSelect,
    label = 'Document',
}: DocumentSelectorProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    // Position for the fixed dropdown
    const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const { documents: allDocs } = useDocumentStore();

    const filtered = query
        ? allDocs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
        : allDocs;

    const selected = allDocs.find((d) => d.id === selectedId);

    // Compute dropdown position from trigger rect
    const openDropdown = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({
            top: rect.bottom + 6,
            left: rect.left,
            width: Math.max(rect.width, 360),
        });
        setOpen(true);
    }, []);

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setQuery('');
        setDropPos(null);
    }, []);

    // Toggle
    const handleTriggerClick = () => {
        if (open) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                closeDropdown();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, closeDropdown]);

    // Close on scroll / resize
    useEffect(() => {
        if (!open) return;
        const handleScroll = () => closeDropdown();
        const handleResize = () => closeDropdown();
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [open, closeDropdown]);

    // Focus search on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const handleSelect = (doc: Document) => {
        onSelect(doc);
        closeDropdown();
    };

    const DocIcon = selected ? getDocIcon(selected.type) : FileText;

    return (
        <>
            {/* ── Trigger button ── */}
            <button
                ref={triggerRef}
                id="doc-selector-trigger"
                onClick={handleTriggerClick}
                className={cn(
                    'flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-[13px] font-medium transition-all duration-150 min-w-[260px] max-w-[380px]',
                    open
                        ? 'border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm'
                )}
            >
                {/* Doc type icon */}
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F1F5F9] shrink-0">
                    <DocIcon size={13} className="text-[#475569]" />
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] leading-none mb-0.5">
                        {label}
                    </p>
                    <p className="text-[13px] font-medium text-[#0F172A] truncate leading-tight">
                        {selected ? formatDocLabel(selected.name) : 'Select a document…'}
                    </p>
                </div>

                {/* Risk dot */}
                {selected?.riskLevel && (
                    <span className={cn('h-2 w-2 rounded-full shrink-0', getRiskDot(selected.riskLevel))} />
                )}

                <ChevronDown
                    size={14}
                    className={cn(
                        'text-[#94A3B8] shrink-0 transition-transform duration-200',
                        open && 'rotate-180'
                    )}
                />
            </button>

            {/* ── Dropdown — rendered via portal so it's never clipped ── */}
            {open && dropPos && createPortal(
                <div
                    ref={dropdownRef}
                    className="cf-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropPos.top,
                        left: dropPos.left,
                        width: dropPos.width,
                        maxHeight: 360,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 9999,
                    }}
                >
                    {/* Search bar */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F1F5F9] shrink-0">
                        <Search size={13} className="text-[#94A3B8] shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search documents…"
                            className="flex-1 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none"
                        />
                    </div>

                    {/* Document list */}
                    <div className="overflow-y-auto doc-scroll flex-1">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-4 text-center text-[12px] text-[#94A3B8]">
                                No documents match "{query}"
                            </div>
                        ) : (
                            <>
                                {!query && (
                                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#CBD5E1]">
                                        Recent Documents
                                    </p>
                                )}
                                {filtered.map((doc) => {
                                    const Icon = getDocIcon(doc.type);
                                    const isSelected = doc.id === selectedId;
                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleSelect(doc)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F8FAFC]',
                                                isSelected && 'bg-[#EFF6FF]'
                                            )}
                                        >
                                            <div className={cn(
                                                'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                                                doc.type.includes('pdf') ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EFF6FF] text-[#2563EB]'
                                            )}>
                                                <Icon size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    'text-[13px] font-medium truncate leading-tight',
                                                    isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'
                                                )}>
                                                    {formatDocLabel(doc.name)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {getStatusIcon(doc.status)}
                                                    <span className="text-[11px] text-[#94A3B8]">
                                                        {formatRelDate(doc.uploadedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            {doc.riskLevel && (
                                                <span className={cn('h-2 w-2 rounded-full shrink-0', getRiskDot(doc.riskLevel))} />
                                            )}
                                            {isSelected && (
                                                <CheckCircle2 size={14} className="text-[#2563EB] shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Upload shortcut */}
                    <div className="border-t border-[#F1F5F9] p-2 shrink-0">
                        <button
                            onClick={() => { navigate('/upload'); closeDropdown(); }}
                            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#F1F5F9]">
                                <Plus size={11} className="text-[#475569]" />
                            </div>
                            Upload new document
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
