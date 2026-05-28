import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useDocumentStore } from '@/store/documentStore';
import { cn } from '@/utils/helpers';

export default function GlobalSearch() {
    const { isSearchOpen, setSearchOpen } = useUIStore();
    const { documents } = useDocumentStore();
    const navigate = useNavigate();
    
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery(''); // reset on close
        }
    }, [isSearchOpen]);

    // Handle Esc key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSearchOpen) {
                setSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, setSearchOpen]);

    if (!isSearchOpen) return null;

    const filteredDocs = documents.filter((doc) =>
        doc.name && doc.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelectDocument = (docId: string) => {
        setSearchOpen(false);
        navigate(`/analysis?doc=${docId}`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setSearchOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-in">
                {/* Search Input Area */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
                    <Search className="text-slate-400 shrink-0" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search documents by name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                        <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-medium text-slate-500 bg-slate-100 rounded">ESC</kbd>
                        <button 
                            onClick={() => setSearchOpen(false)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 sm:hidden"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto doc-scroll p-2">
                    {query.trim() === '' ? (
                        <div className="py-12 text-center text-slate-500 text-[13px]">
                            Type to start searching your documents...
                        </div>
                    ) : filteredDocs.length > 0 ? (
                        <div className="space-y-1">
                            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                                Documents
                            </div>
                            {filteredDocs.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => handleSelectDocument(doc.id)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-50/50 group text-left transition-colors"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-medium text-slate-900 truncate">
                                            {doc.name}
                                        </p>
                                        <p className="text-[12px] text-slate-500 truncate mt-0.5 flex items-center gap-2">
                                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                            <span>•</span>
                                            <span className={cn(
                                                "capitalize",
                                                doc.status === 'completed' ? "text-green-600" : "text-amber-600"
                                            )}>
                                                {doc.status}
                                            </span>
                                        </p>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-[13px]">
                            <p className="text-slate-900 font-medium mb-1">No results found for "{query}"</p>
                            <p className="text-slate-500">Try adjusting your search term.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
