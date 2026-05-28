import { useEffect, useState, useCallback } from 'react';
import { PenTool, CheckCircle, ArrowRightLeft, Loader2, Sparkles, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import DocumentSelector from '@/components/DocumentSelector';
import { getNegotiationSuggestions, getNegotiatedText, triggerAnalysis } from '@/services/documentService';
import { useDocumentStore } from '@/store/documentStore';
import type { Document, NegotiationSuggestion } from '@/types';
import { cn } from '@/utils/helpers';

export default function NegotiationPage() {
    const { documents, fetchDocuments } = useDocumentStore();
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [suggestions, setSuggestions] = useState<NegotiationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        if (documents.length === 0) {
            fetchDocuments();
        }
    }, [documents.length, fetchDocuments]);

    useEffect(() => {
        if (documents.length > 0 && !selectedDoc) {
            const completed = documents.find(d => d.status === 'completed');
            setSelectedDoc(completed || documents[0]);
        }
    }, [documents, selectedDoc]);

    const loadSuggestions = useCallback(async (docId: string) => {
        setIsLoading(true);
        setSuggestions([]);
        try {
            const result = await getNegotiationSuggestions(docId);
            if (result && result.suggestions) {
                setSuggestions(result.suggestions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDoc) {
            if (selectedDoc.status === 'unanalyzed') {
                setSuggestions([]);
                setIsLoading(false);
            } else {
                loadSuggestions(selectedDoc.id);
            }
        }
    }, [selectedDoc?.id, selectedDoc?.status, loadSuggestions]);

    const handleTriggerAnalysis = async () => {
        if (!selectedDoc) return;
        try {
            const updatedDoc = await triggerAnalysis(selectedDoc.id);
            setSelectedDoc(updatedDoc);
            fetchDocuments();
        } catch (e) {
            alert('Failed to start analysis.');
        }
    };

    const handleDocSelect = (doc: Document) => {
        setSelectedDoc(doc);
    };

    const handleGeneratePDF = async () => {
        if (!selectedDoc) return;
        setIsGeneratingPDF(true);
        try {
            const text = await getNegotiatedText(selectedDoc.id);
            const doc = new jsPDF();
            
            doc.setFontSize(16);
            doc.text(`Negotiated Contract: ${selectedDoc.name}`, 15, 20);
            
            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(text, 180);
            
            let y = 30;
            for (let i = 0; i < splitText.length; i++) {
                if (y > 280) {
                    y = 20;
                    doc.addPage();
                }
                doc.text(splitText[i], 15, y);
                y += 5;
            }
            
            doc.save(`negotiated_${selectedDoc.name.replace(/\.[^/.]+$/, "")}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please ensure the document is fully processed.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="cf-page">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-slide-up mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                            Negotiation Suggestions
                        </h1>
                        {selectedDoc && suggestions.length > 0 && (
                            <button 
                                onClick={handleGeneratePDF}
                                disabled={isGeneratingPDF}
                                className="cf-btn cf-btn-primary self-start sm:self-auto shrink-0"
                            >
                                {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={16} />}
                                {isGeneratingPDF ? 'Generating...' : 'Export Negotiated PDF'}
                            </button>
                        )}
                    </div>
                    {selectedDoc && (
                        <DocumentSelector
                            selectedId={selectedDoc.id}
                            onSelect={handleDocSelect}
                            label="Analyzing"
                        />
                    )}
                </div>
            </div>

            {selectedDoc?.status === 'unanalyzed' ? (
                <div className="mt-6 cf-card p-12 text-center animate-fade-slide-up">
                    <ArrowRightLeft size={32} className="mx-auto text-[#CBD5E1] mb-4" />
                    <h2 className="text-[18px] font-bold text-[#0F172A] mb-2">Negotiation Skipped</h2>
                    <p className="text-[14px] text-[#64748B] mb-6 max-w-md mx-auto">
                        This document was uploaded without triggering AI analysis. 
                        You can analyze it now to generate redline suggestions.
                    </p>
                    <button
                        onClick={handleTriggerAnalysis}
                        className="cf-btn cf-btn-primary mx-auto"
                    >
                        Analyze Now
                    </button>
                </div>
            ) : isLoading ? (
                <div className="mt-6 flex flex-col items-center justify-center p-5 cf-card">
                    <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-4" />
                    <p className="text-[#475569] font-medium text-sm">Generating AI redline suggestions...</p>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="mt-6 space-y-4 animate-fade-slide-up" style={{ animationDelay: '80ms' }}>
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="cf-card overflow-hidden">
                            <div className="bg-[#F8FAFC] px-4 py-2 border-b border-[#E2E8F0] flex items-center gap-1.5">
                                <Sparkles size={14} className="text-[#8B5CF6]" />
                                <span className="text-[12px] font-semibold text-[#0F172A]">AI Suggestion #{index + 1}</span>
                            </div>

                            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
                                {/* Original */}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Original Text</h4>
                                    </div>
                                    <p className="text-[12px] text-[#475569] leading-relaxed bg-[#FEF2F2] p-2.5 rounded-md border border-[#FCA5A5]/30">
                                        {suggestion.original_text}
                                    </p>
                                </div>

                                {/* Suggested */}
                                <div className="p-4 bg-[#FAFAFA]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Suggested Redline</h4>
                                    </div>
                                    <p className="text-[12px] text-[#0F172A] leading-relaxed bg-[#ECFDF5] p-2.5 rounded-md border border-[#6EE7B7]/30 font-medium">
                                        {suggestion.suggested_text}
                                    </p>
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div className="p-4 border-t border-[#E2E8F0] bg-white">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Why this change?</h4>
                                <p className="text-[12px] text-[#475569] leading-relaxed">
                                    {suggestion.reasoning}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : selectedDoc ? (
                <div className="mt-6 text-center cf-card p-5">
                    <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
                    <h3 className="text-[#0F172A] font-semibold text-[16px]">No major risks detected</h3>
                    <p className="text-[#64748B] text-[13px] mt-1">This document appears to be well-balanced. No critical negotiation suggestions generated.</p>
                </div>
            ) : null}
        </div>
    );
}
