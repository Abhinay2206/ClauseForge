import axios from 'axios';
import api from '@/services/api';
import type { Document, AnalysisResult, ComparisonResult, ChatMessage, DashboardStats, Report } from '@/types';
import {
    mockAnalysis,
    mockComparison,
    mockChatResponses,
    mockDashboardStats,
} from './mockData';

/**
 * Simulated API delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Document Service - uses mock data with simulated latency.
 * Swap implementations with real API calls when backend is ready.
 */

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

export async function getDocument(id: string): Promise<Document | undefined> {
    await delay(500);
    return undefined; // mock disabled
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
    onProgress?: (percent: number) => void
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

        // 3. Register document in backend
        const response = await api.post('/api/documents', {
            name: file.name,
            s3Key: key,
            type: file.type,
            size: file.size
        });

        const doc = response.data;
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

export async function sendChatMessage(
    message: string,
    _documentId?: string
): Promise<ChatMessage> {
    await delay(1500);

    const lowerMsg = message.toLowerCase();
    let responseContent = mockChatResponses.default;

    if (lowerMsg.includes('risk')) responseContent = mockChatResponses.risk;
    else if (lowerMsg.includes('clause')) responseContent = mockChatResponses.clause;
    else if (lowerMsg.includes('summary') || lowerMsg.includes('summarize'))
        responseContent = mockChatResponses.summary;

    return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    await delay(600);
    return mockDashboardStats;
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
