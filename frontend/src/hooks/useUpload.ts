import { useState, useCallback } from 'react';
import { uploadDocument } from '@/services/documentService';
import type { Document } from '@/types';

/**
 * Upload hook with progress tracking.
 */
export function useUpload() {
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null);

    const upload = useCallback(async (file: File) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setUploadedDoc(null);

        try {
            const doc = await uploadDocument(file, (percent) => {
                setProgress(percent);
            });
            setUploadedDoc(doc);
            return doc;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setProgress(0);
        setIsUploading(false);
        setError(null);
        setUploadedDoc(null);
    }, []);

    return { upload, progress, isUploading, error, uploadedDoc, reset };
}
