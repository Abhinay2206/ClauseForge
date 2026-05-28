/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import api from '@/services/api';
import type { Document, AnalysisResult, ComparisonResult, Report, ComparisonHistoryItem } from '@/types';

export async function getDocuments(): Promise<Document[]> {
    try {
        const { data } = await api.get('/api/documents');
        const realDocs = data.map((doc: any) => ({
            id: doc._id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            uploadedAt: doc.createdAt,
            status: doc.status,
            riskScore: doc.overallRiskScore,
            riskLevel: doc.riskLevel
        }));
        return realDocs;
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        return [];
    }
}

export async function deleteDocument(id: string): Promise<void> {
    try {
        await api.delete(`/api/documents/${id}`);
    } catch (error) {
        console.error('Failed to delete document:', error);
        throw new Error('Failed to delete document');
    }
}

export async function uploadDocument(
    file: File,
    onProgress?: (percent: number) => void,
    skipAnalysis?: boolean
): Promise<Document> {
    try {
        // 1. Get presigned URL from backend
        const { data } = await api.get('/api/documents/upload-url', {
            params: {
                filename: file.name,
                filetype: file.type
            }
        });
        const { uploadUrl, key } = data;

        // 2. Upload directly to S3
        await axios.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress?.(percent);
                }
            }
        });

        // 3. Register with backend
        const { data: registeredDoc } = await api.post('/api/documents', {
            name: file.name,
            s3Key: key,
            type: file.type,
            size: file.size,
            skipAnalysis
        });

        const doc = registeredDoc;
        return {
            id: doc._id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            uploadedAt: doc.createdAt,
            status: doc.status
        };
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload document. Please check your connection and try again.');
    }
}

export async function getAnalysis(documentId: string): Promise<AnalysisResult> {
    try {
        const { data } = await api.get(`/api/documents/${documentId}/analysis`);
        return data;
    } catch (error) {
        console.error('Failed to fetch analysis:', error);
        throw error;
    }
}

export async function compareDocuments(
    docAId: string,
    docBId: string
): Promise<ComparisonResult> {
    try {
        const { data } = await api.get(`/api/documents/compare/${docAId}/${docBId}`);
        return data;
    } catch (error) {
        console.error('Failed to compare documents:', error);
        throw error;
    }
}

export async function getComparisonHistory(): Promise<ComparisonHistoryItem[]> {
    try {
        const { data } = await api.get('/api/documents/comparisons');
        return data;
    } catch (error) {
        console.error('Failed to fetch comparison history:', error);
        return [];
    }
}

export async function getComparisonById(id: string): Promise<ComparisonResult> {
    try {
        const { data } = await api.get(`/api/documents/comparisons/${id}`);
        return data;
    } catch (error) {
        console.error('Failed to fetch comparison:', error);
        throw error;
    }
}

export async function deleteComparison(id: string): Promise<void> {
    try {
        await api.delete(`/api/documents/comparisons/${id}`);
    } catch (error) {
        console.error('Failed to delete comparison:', error);
        throw error;
    }
}

export async function explainClause(text: string, type: string, riskLevel: string): Promise<string> {
    try {
        const { data } = await api.post('/api/documents/explain-clause', {
            text,
            type,
            riskLevel
        });
        return data.explanation;
    } catch (error) {
        console.error('Failed to explain clause:', error);
        return 'Failed to generate explanation. Please try again.';
    }
}

export async function triggerAnalysis(id: string): Promise<Document> {
    try {
        const { data } = await api.post(`/api/documents/${id}/analyze`);
        return {
            id: data._id,
            name: data.name,
            type: data.type,
            size: data.size,
            uploadedAt: data.createdAt,
            status: data.status,
            riskScore: data.overallRiskScore,
            riskLevel: data.riskLevel
        };
    } catch (error) {
        console.error('Failed to trigger analysis:', error);
        throw error;
    }
}

export async function generateDocumentReport(documentId: string): Promise<Report> {
    try {
        const { data } = await api.post(`/api/documents/${documentId}/report`);
        return {
            documentId,
            documentName: data.documentName || 'Document',
            fullAiReport: data.report,
            clauseAnalysis: data.clauseAnalysis || [],
            riskInsights: data.riskInsights || [],
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to generate report:', error);
        throw error;
    }
}

export async function getNegotiationSuggestions(documentId: string) {
    try {
        const { data } = await api.get(`/api/documents/${documentId}/negotiate`);
        return data;
    } catch (error) {
        console.error('Failed to get negotiation suggestions:', error);
        throw error;
    }
}

export async function getActionItems(documentId: string) {
    try {
        const { data } = await api.get(`/api/documents/${documentId}/actions`);
        return data;
    } catch (error) {
        console.error('Failed to get action items:', error);
        throw error;
    }
}

export async function getAllActionItems() {
    try {
        const { data } = await api.get(`/api/documents/all/actions`);
        return data;
    } catch (error) {
        console.error('Failed to get all action items:', error);
        return { items: [] };
    }
}

export async function getReport(documentId: string): Promise<Report> {
    try {
        const { data } = await api.get(`/api/documents/${documentId}/report`);
        return {
            documentId,
            documentName: data.documentName || 'Document',
            fullAiReport: data.report,
            clauseAnalysis: data.clauseAnalysis || [],
            riskInsights: data.riskInsights || [],
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to fetch report:', error);
        throw error;
    }
}

export async function getNegotiatedText(id: string): Promise<string> {
    try {
        const { data } = await api.get(`/api/documents/${id}/negotiated-text`);
        return data.text;
    } catch (error) {
        console.error('Failed to fetch negotiated text:', error);
        throw error;
    }
}
