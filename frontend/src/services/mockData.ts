import type {
    Document,
    AnalysisResult,
    ComparisonResult,
    ChatMessage,
    DashboardStats,
    Report,
} from '@/types';

/* ============================================
   Mock Data for ClauseForge
   ============================================ */

export const mockDocuments: Document[] = [
    {
        id: 'doc-1',
        name: 'Master Service Agreement - TechCorp.pdf',
        type: 'application/pdf',
        size: 245000,
        uploadedAt: '2026-03-15T10:30:00Z',
        status: 'completed',
        riskScore: 72,
        riskLevel: 'high',
        content: `MASTER SERVICE AGREEMENT

This Master Service Agreement ("Agreement") is entered into as of March 1, 2026, by and between TechCorp Inc. ("Client") and ServicePro LLC ("Provider").

1. TERMINATION CLAUSE
Either party may terminate this Agreement upon 30 days written notice. However, the Client reserves the right to terminate immediately without notice if the Provider fails to meet performance benchmarks for two consecutive quarters. In the event of early termination by the Provider, a penalty of 25% of the remaining contract value shall be payable.

2. LIABILITY AND INDEMNIFICATION
The Provider shall indemnify the Client against all losses, damages, and expenses arising from the Provider's negligence or willful misconduct. The total aggregate liability under this agreement shall not exceed 200% of the fees paid in the twelve months preceding the claim. Neither party shall be liable for consequential, indirect, or punitive damages.

3. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all proprietary information shared during the term of this Agreement and for a period of five (5) years following termination. Confidential information includes trade secrets, business plans, customer data, and financial records.

4. NON-COMPETE
The Provider agrees not to engage in any business that directly competes with the Client's core offerings for a period of two (2) years after the termination of this Agreement, within any jurisdiction where the Client operates. This restriction applies to all employees and subcontractors of the Provider.

5. PAYMENT TERMS
The Client shall pay all invoices within Net 45 days. Late payments shall incur interest at 1.5% per month. The Provider may suspend services if payment is overdue by more than 60 days. All fees are non-refundable once services have been commenced.

6. INTELLECTUAL PROPERTY
All intellectual property developed during the provision of services shall be the exclusive property of the Client. The Provider retains no rights to any work product created under this Agreement.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws provisions.

8. FORCE MAJEURE
Neither party shall be liable for delays or failure to perform due to causes beyond their reasonable control, including natural disasters, pandemics, government actions, or cyber attacks.

9. DISPUTE RESOLUTION
Any disputes arising under this Agreement shall first be submitted to mediation. If mediation fails within 60 days, the dispute shall be resolved through binding arbitration in Wilmington, Delaware.`,
    },
    {
        id: 'doc-2',
        name: 'Software License Agreement - DataFlow.pdf',
        type: 'application/pdf',
        size: 189000,
        uploadedAt: '2026-03-14T14:15:00Z',
        status: 'completed',
        riskScore: 45,
        riskLevel: 'medium',
        content: `SOFTWARE LICENSE AGREEMENT

This Software License Agreement is entered into between DataFlow Inc. ("Licensor") and the undersigned Licensee.

1. LICENSE GRANT
Licensor grants Licensee a non-exclusive, non-transferable license to use the software for internal business purposes only.

2. RESTRICTIONS
Licensee shall not reverse engineer, decompile, or modify the software. Sublicensing is prohibited without prior written consent.

3. PAYMENT
Licensee shall pay an annual fee of $50,000 due within 30 days of invoice date.

4. WARRANTY
The software is provided "as is" without warranties of any kind, express or implied.

5. LIMITATION OF LIABILITY
Licensor's total liability shall not exceed the license fees paid in the preceding 12 months.`,
    },
    {
        id: 'doc-3',
        name: 'Employment Contract - Senior Engineer.pdf',
        type: 'application/pdf',
        size: 156000,
        uploadedAt: '2026-03-13T09:00:00Z',
        status: 'completed',
        riskScore: 28,
        riskLevel: 'low',
    },
    {
        id: 'doc-4',
        name: 'NDA - Partnership Agreement.pdf',
        type: 'application/pdf',
        size: 98000,
        uploadedAt: '2026-03-12T16:45:00Z',
        status: 'completed',
        riskScore: 61,
        riskLevel: 'medium',
    },
    {
        id: 'doc-5',
        name: 'Vendor Agreement - CloudHost.pdf',
        type: 'application/pdf',
        size: 312000,
        uploadedAt: '2026-03-11T11:20:00Z',
        status: 'analyzing',
        riskScore: undefined,
        riskLevel: undefined,
    },
];

export const mockAnalysis: AnalysisResult = {
    documentId: 'doc-1',
    overallRiskScore: 72,
    riskLevel: 'high',
    summary:
        'This Master Service Agreement contains several high-risk clauses, particularly around termination penalties, broad non-compete restrictions, and unlimited indemnification obligations. Immediate legal review is recommended before signing.',
    analyzedAt: '2026-03-15T10:35:00Z',
    clauses: [
        {
            id: 'clause-1',
            text: 'the Client reserves the right to terminate immediately without notice if the Provider fails to meet performance benchmarks for two consecutive quarters',
            type: 'termination',
            riskLevel: 'high',
            startIndex: 280,
            endIndex: 454,
            explanation:
                'One-sided termination right without notice period creates significant risk. Consider negotiating a cure period of at least 30 days.',
        },
        {
            id: 'clause-2',
            text: 'a penalty of 25% of the remaining contract value shall be payable',
            type: 'termination',
            riskLevel: 'high',
            startIndex: 510,
            endIndex: 575,
            explanation:
                'Termination penalty is unusually high at 25%. Industry standard is typically 5-10% of remaining value.',
        },
        {
            id: 'clause-3',
            text: 'The total aggregate liability under this agreement shall not exceed 200% of the fees paid',
            type: 'liability',
            riskLevel: 'medium',
            startIndex: 730,
            endIndex: 822,
            explanation:
                'Liability cap of 200% is above market standard (typically 100%). This could expose the Provider to excessive financial risk.',
        },
        {
            id: 'clause-4',
            text: 'for a period of five (5) years following termination',
            type: 'confidentiality',
            riskLevel: 'medium',
            startIndex: 1050,
            endIndex: 1103,
            explanation:
                '5-year post-termination confidentiality period is longer than standard (2-3 years). Consider negotiating to 3 years.',
        },
        {
            id: 'clause-5',
            text: 'for a period of two (2) years after the termination of this Agreement, within any jurisdiction where the Client operates',
            type: 'non-compete',
            riskLevel: 'high',
            startIndex: 1300,
            endIndex: 1422,
            explanation:
                'Broad geographic scope and 2-year duration of non-compete may be unenforceable in many jurisdictions and is unnecessarily restrictive.',
        },
        {
            id: 'clause-6',
            text: 'Late payments shall incur interest at 1.5% per month',
            type: 'payment',
            riskLevel: 'medium',
            startIndex: 1600,
            endIndex: 1652,
            explanation:
                '1.5% monthly interest (18% annually) exceeds legal limits in some jurisdictions. Verify compliance with local usury laws.',
        },
        {
            id: 'clause-7',
            text: 'All intellectual property developed during the provision of services shall be the exclusive property of the Client',
            type: 'intellectual-property',
            riskLevel: 'low',
            startIndex: 1850,
            endIndex: 1963,
            explanation:
                'Standard work-for-hire IP assignment. Consider retaining rights to pre-existing IP and general know-how.',
        },
        {
            id: 'clause-8',
            text: 'governed by and construed in accordance with the laws of the State of Delaware',
            type: 'governing-law',
            riskLevel: 'low',
            startIndex: 2050,
            endIndex: 2130,
            explanation:
                'Delaware is a standard governing law choice for business contracts. No significant risk.',
        },
    ],
    risks: [
        {
            id: 'risk-1',
            category: 'Termination',
            description: 'One-sided immediate termination rights and 25% early exit penalty',
            severity: 'high',
            recommendation: 'Negotiate mutual termination rights with 60-day notice and reduce penalty to 10%',
        },
        {
            id: 'risk-2',
            category: 'Non-Compete',
            description: 'Overly broad geographic and temporal non-compete restrictions',
            severity: 'high',
            recommendation: 'Limit to 1 year and specific geographic markets only',
        },
        {
            id: 'risk-3',
            category: 'Liability',
            description: 'Liability cap at 200% exceeds industry standard',
            severity: 'medium',
            recommendation: 'Negotiate down to 100% of fees paid in preceding 12 months',
        },
        {
            id: 'risk-4',
            category: 'Confidentiality',
            description: '5-year post-termination confidentiality obligation',
            severity: 'medium',
            recommendation: 'Reduce to 2-3 years with clear exceptions for publicly available information',
        },
        {
            id: 'risk-5',
            category: 'Payment',
            description: 'High late payment interest at 18% annually',
            severity: 'medium',
            recommendation: 'Reduce to 1% per month or prime rate + 2%',
        },
        {
            id: 'risk-6',
            category: 'IP Assignment',
            description: 'Blanket IP assignment without pre-existing IP carve-out',
            severity: 'low',
            recommendation: 'Add clause retaining rights to pre-existing IP and tools',
        },
    ],
};

export const mockComparison: ComparisonResult = {
    documentA: { id: 'doc-1', name: 'MSA v1 - TechCorp' },
    documentB: { id: 'doc-2', name: 'MSA v2 - TechCorp' },
    similarity: 78,
    changes: 12,
    diffA: [
        { text: 'This Master Service Agreement ("Agreement") is entered into as of ', type: 'unchanged' },
        { text: 'March 1, 2026', type: 'removed' },
        { text: ', by and between TechCorp Inc. and ServicePro LLC.\n\n', type: 'unchanged' },
        { text: '1. TERMINATION\nEither party may terminate upon ', type: 'unchanged' },
        { text: '30 days', type: 'removed' },
        { text: ' written notice.\n\n', type: 'unchanged' },
        { text: '2. LIABILITY\nTotal aggregate liability shall not exceed ', type: 'unchanged' },
        { text: '200% of fees paid', type: 'modified' },
        { text: ' in the preceding 12 months.\n\n', type: 'unchanged' },
        { text: '3. NON-COMPETE\nDuration: ', type: 'unchanged' },
        { text: 'two (2) years', type: 'removed' },
        { text: ' in all jurisdictions.\n', type: 'unchanged' },
    ],
    diffB: [
        { text: 'This Master Service Agreement ("Agreement") is entered into as of ', type: 'unchanged' },
        { text: 'June 15, 2026', type: 'added' },
        { text: ', by and between TechCorp Inc. and ServicePro LLC.\n\n', type: 'unchanged' },
        { text: '1. TERMINATION\nEither party may terminate upon ', type: 'unchanged' },
        { text: '60 days', type: 'added' },
        { text: ' written notice.\n\n', type: 'unchanged' },
        { text: '2. LIABILITY\nTotal aggregate liability shall not exceed ', type: 'unchanged' },
        { text: '100% of fees paid', type: 'modified' },
        { text: ' in the preceding 12 months.\n\n', type: 'unchanged' },
        { text: '3. NON-COMPETE\nDuration: ', type: 'unchanged' },
        { text: 'one (1) year', type: 'added' },
        { text: ' in all jurisdictions.\n', type: 'unchanged' },
        { text: '\n4. ARBITRATION\nAdded new binding arbitration clause for disputes over $50,000.', type: 'added' },
    ],
};

export const mockChatHistory: ChatMessage[] = [
    {
        id: 'msg-1',
        role: 'assistant',
        content:
            "Hello! I'm your AI legal assistant. I can help you analyze documents, explain clauses, and identify risks. How can I help you today?",
        timestamp: '2026-03-15T10:30:00Z',
    },
];

export const mockChatResponses: Record<string, string> = {
    default:
        "I've analyzed the document and here are my observations. The agreement contains several clauses that warrant attention, particularly around termination rights and liability caps. Would you like me to go into more detail on any specific area?",
    risk: "Based on my analysis, the overall risk score is **72/100 (High)**. The primary risk factors are:\n\n1. **Termination Penalty** - 25% of remaining contract value is significantly above market rate\n2. **Non-Compete Scope** - The geographic and temporal restrictions are likely unenforceable\n3. **Liability Cap** - 200% exposure exceeds industry standard\n\nI recommend negotiating these terms before signing.",
    clause:
        "I found **8 distinct clauses** in this document:\n\n- 2 Termination clauses (⚠️ High Risk)\n- 1 Liability clause (🟡 Medium Risk)\n- 1 Confidentiality clause (🟡 Medium Risk)\n- 1 Non-Compete clause (⚠️ High Risk)\n- 1 Payment clause (🟡 Medium Risk)\n- 1 IP Assignment clause (✅ Low Risk)\n- 1 Governing Law clause (✅ Low Risk)",
    summary:
        "**Document Summary:**\n\nThis is a Master Service Agreement between TechCorp Inc. (Client) and ServicePro LLC (Provider). Key terms include:\n\n- **Duration**: Not specified (evergreen with termination rights)\n- **Payment**: Net 45 days, 1.5%/month late fee\n- **IP**: Full assignment to Client\n- **Governing Law**: Delaware\n- **Dispute Resolution**: Mediation → Binding Arbitration\n\nThe agreement heavily favors the Client, particularly in termination rights and non-compete restrictions.",
};

export const mockDashboardStats: DashboardStats = {
    totalDocuments: 24,
    averageRiskScore: 52,
    highRiskDocuments: 7,
    riskDistribution: [
        { name: 'Low Risk', value: 9, color: '#22c55e' },
        { name: 'Medium Risk', value: 8, color: '#f59e0b' },
        { name: 'High Risk', value: 7, color: '#ef4444' },
    ],
    clauseDistribution: [
        { name: 'Termination', count: 18 },
        { name: 'Liability', count: 15 },
        { name: 'Confidentiality', count: 22 },
        { name: 'Non-Compete', count: 8 },
        { name: 'Payment', count: 20 },
        { name: 'IP', count: 12 },
        { name: 'Force Majeure', count: 6 },
        { name: 'Dispute', count: 10 },
    ],
};

export const mockReport: Report = {
    documentId: 'doc-1',
    documentName: 'Master Service Agreement - TechCorp.pdf',
    summary:
        'This Master Service Agreement presents significant legal risks that require attention before execution. Key concerns include asymmetric termination rights, aggressive non-compete clauses, and above-market liability exposure. The agreement is heavily weighted in favor of the Client.',
    clauseAnalysis: [
        { type: 'termination', count: 2, riskBreakdown: { low: 0, medium: 0, high: 2 } },
        { type: 'liability', count: 1, riskBreakdown: { low: 0, medium: 1, high: 0 } },
        { type: 'confidentiality', count: 1, riskBreakdown: { low: 0, medium: 1, high: 0 } },
        { type: 'non-compete', count: 1, riskBreakdown: { low: 0, medium: 0, high: 1 } },
        { type: 'payment', count: 1, riskBreakdown: { low: 0, medium: 1, high: 0 } },
        { type: 'intellectual-property', count: 1, riskBreakdown: { low: 1, medium: 0, high: 0 } },
        { type: 'governing-law', count: 1, riskBreakdown: { low: 1, medium: 0, high: 0 } },
    ],
    riskInsights: [
        'The termination clause allows Client to terminate without notice, creating significant business continuity risk for the Provider.',
        'Non-compete restrictions spanning all jurisdictions where Client operates may be unenforceable and should be narrowed.',
        'Liability cap of 200% is double the industry standard and exposes Provider to excessive financial risk.',
        'Five-year post-termination confidentiality period exceeds market norms of 2-3 years.',
        'Late payment interest at 18% annually may exceed usury laws in certain jurisdictions.',
    ],
    generatedAt: '2026-03-15T10:40:00Z',
};
