import { create } from 'zustand';

interface UIStore {
    sidebarOpen: boolean;
    isSearchOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSearchOpen: (open: boolean) => void;
}

/**
 * UI store - global UI state.
 */
export const useUIStore = create<UIStore>((set) => ({
    sidebarOpen: true,
    isSearchOpen: false,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSearchOpen: (open) => set({ isSearchOpen: open }),
}));
