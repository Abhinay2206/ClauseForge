import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data-fetching hook with loading, error, and refetch support.
 */
export function useFetch<T>(
    fetchFn: () => Promise<T>,
    deps: unknown[] = []
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        execute();
    }, [execute]);

    return { data, isLoading, error, refetch: execute };
}
