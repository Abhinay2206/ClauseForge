import { create } from 'zustand';
import type { Document, AnalysisResult } from '@/types';
import * as documentService from '@/services/documentService';

interface DocumentStore {
    documents: Document[];
    currentAnalysis: AnalysisResult | null;
    isLoading: boolean;
    error: string | null;
    fetchDocuments: (silent?: boolean) => Promise<void>;
    setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
    fetchAnalysis: (documentId: string) => Promise<void>;
    addDocument: (doc: Document) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
    documents: [],
    currentAnalysis: null,
    isLoading: false,
    error: null,

    fetchDocuments: async (silent = false) => {
        if (!silent) set({ isLoading: true, error: null });
        try {
            const documents = await documentService.getDocuments();
            set({ documents, isLoading: false });
        } catch {
            set({ error: 'Failed to fetch documents', isLoading: false });
        }
    },

    setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

    fetchAnalysis: async (documentId: string) => {
        set({ isLoading: true, error: null });
        try {
            const analysis = await documentService.getAnalysis(documentId);
            set({ currentAnalysis: analysis, isLoading: false });
        } catch {
            set({ error: 'Failed to fetch analysis', isLoading: false });
        }
    },

    addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
}));
