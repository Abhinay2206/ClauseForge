import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export function useKeyboardShortcuts() {
    const { isSearchOpen, setSearchOpen } = useUIStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd + K (Mac) or Ctrl + K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(!isSearchOpen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, setSearchOpen]);
}
