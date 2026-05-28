import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';

export function useDocumentPolling(intervalMs = 3000) {
    const { documents, fetchDocuments } = useDocumentStore();

    useEffect(() => {
        // Check if any document is in a pending or analyzing state
        const hasActiveJobs = documents.some(
            (doc) => doc.status === 'pending' || doc.status === 'analyzing'
        );

        if (hasActiveJobs) {
            const interval = setInterval(() => {
                fetchDocuments(true); // silent fetch
            }, intervalMs);

            return () => clearInterval(interval);
        }
    }, [documents, fetchDocuments, intervalMs]);
}
