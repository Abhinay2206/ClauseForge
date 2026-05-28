import { useEffect, useState, useCallback } from 'react';
import { CheckSquare, ListTodo, Loader2, Calendar } from 'lucide-react';
import DocumentSelector from '@/components/DocumentSelector';
import { getActionItems } from '@/services/documentService';
import { useDocumentStore } from '@/store/documentStore';
import type { Document, ActionItem } from '@/types';
import { cn } from '@/utils/helpers';

export default function ActionItemsPage() {
    const { documents, fetchDocuments } = useDocumentStore();
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [items, setItems] = useState<ActionItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

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

    const loadActionItems = useCallback(async (docId: string) => {
        setIsLoading(true);
        setItems([]);
        setCompletedItems(new Set());
        try {
            const result = await getActionItems(docId);
            if (result && result.items) {
                setItems(result.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDoc) {
            loadActionItems(selectedDoc.id);
        }
    }, [selectedDoc?.id, loadActionItems]);

    const handleDocSelect = (doc: Document) => {
        setSelectedDoc(doc);
    };

    const toggleItem = (index: number) => {
        const next = new Set(completedItems);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setCompletedItems(next);
    };

    const completedCount = completedItems.size;
    const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
        <div className="cf-page">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-slide-up">
                <div className="flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A] mb-3 flex items-center gap-2">
                        Action Items
                    </h1>
                    {selectedDoc && (
                        <DocumentSelector
                            selectedId={selectedDoc.id}
                            onSelect={handleDocSelect}
                            label="Extracting from"
                        />
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="mt-8 flex flex-col items-center justify-center p-8 cf-card">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                    <p className="text-[#475569] font-medium text-sm">Extracting actionable items from document...</p>
                </div>
            ) : items.length > 0 ? (
                <div className="mt-6 animate-fade-slide-up" style={{ animationDelay: '80ms' }}>

                    {/* Progress Bar */}
                    <div className="cf-card p-4 mb-6 bg-white flex items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[12px] font-semibold text-[#475569] uppercase tracking-wider">Workflow Progress</span>
                                <span className="text-[13px] font-bold text-[#0F172A]">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-[24px] font-bold text-[#0F172A] leading-none">{completedCount} <span className="text-[14px] text-[#94A3B8] font-normal">/ {items.length}</span></p>
                            <p className="text-[11px] font-medium text-[#64748B] mt-1">Tasks Completed</p>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {items.map((item, index) => {
                            const isCompleted = completedItems.has(index);
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "cf-card p-4 flex items-start gap-3 transition-all duration-200 border-l-4",
                                        isCompleted ? "border-l-green-500 bg-[#F8FAFC] opacity-75" : "border-l-blue-600 hover:shadow-md"
                                    )}
                                    onClick={() => toggleItem(index)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            isCompleted ? "bg-green-500 border-green-500 text-white" : "border-[#CBD5E1] text-transparent hover:border-blue-500"
                                        )}>
                                            <CheckSquare size={14} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn(
                                            "text-[14px] font-semibold mb-1",
                                            isCompleted ? "text-[#64748B] line-through" : "text-[#0F172A]"
                                        )}>
                                            {item.task}
                                        </h3>
                                        <p className="text-[12px] text-[#475569] leading-relaxed mb-2">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-md inline-flex">
                                            <Calendar size={12} />
                                            {item.deadline}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : selectedDoc ? (
                <div className="mt-8 text-center cf-card p-8">
                    <ListTodo className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
                    <h3 className="text-[#0F172A] font-semibold text-[16px]">No action items found</h3>
                    <p className="text-[#64748B] text-[13px] mt-1">This document does not appear to contain any clear actionable workflows or deadlines.</p>
                </div>
            ) : null}
        </div>
    );
}
