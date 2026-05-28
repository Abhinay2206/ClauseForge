import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    FileSearch,
    ShieldAlert,
    GitCompareArrows,
    MessageSquare,
    FileText,
    LogOut,
    Menu,
    X,
    Scale,
    Plus,
    Settings,
    FolderOpen,
    ChevronRight,
    ShieldCheck,
    Search,
    Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/helpers';
import GlobalSearch from '@/components/GlobalSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const workspaceItems = [
    { to: '/dashboard', icon: FolderOpen, label: 'Documents' },
    { to: '/upload',    icon: Plus,       label: 'New Document' },
];

const toolItems = [
    { to: '/analysis', icon: FileSearch,       label: 'Analysis' },
    { to: '/risk',     icon: ShieldAlert,      label: 'Risk Analysis' },
    { to: '/compare',  icon: GitCompareArrows, label: 'Compare' },
    { to: '/chat',     icon: MessageSquare,    label: 'AI Assistant' },
    { to: '/report',   icon: FileText,         label: 'Reports' },
];

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Documents',
    '/upload':    'New Document',
    '/analysis':  'Analysis',
    '/risk':      'Risk Analysis',
    '/compare':   'Compare',
    '/chat':      'AI Assistant',
    '/report':    'Reports',
    '/profile':   'Profile',
};

function NavGroup({ label, items, onClick }: {
    label: string;
    items: typeof workspaceItems;
    onClick: () => void;
}) {
    return (
        <div className="mb-6">
            <p className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                {label}
            </p>
            <div className="space-y-1">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClick}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center gap-3 rounded-md px-4 py-2.5 text-[13px] font-medium transition-all duration-200 relative mx-2',
                                isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-600" />
                                )}
                                <item.icon
                                    size={16}
                                    className={cn(
                                        'shrink-0 transition-colors duration-200',
                                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                    )}
                                />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}

export default function DashboardLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { setSearchOpen } = useUIStore();
    useKeyboardShortcuts();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pageTitle = PAGE_TITLES[location.pathname] ?? 'ClauseForge';
    const isToolRoute = toolItems.some(item => location.pathname.startsWith(item.to));
    const breadcrumbGroup = isToolRoute ? 'Analysis Tools' : 'Workspace';
    
    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* ═══ Sidebar ═══ */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-white border-r border-slate-200 transition-transform duration-300 lg:relative lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-sm shadow-blue-600/30">
                        <Scale size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-bold tracking-tight text-slate-900">
                            ClauseForge
                        </span>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-6 chat-scroll">
                    <NavGroup
                        label="Workspace"
                        items={workspaceItems}
                        onClick={() => setMobileOpen(false)}
                    />
                    <NavGroup
                        label="Analysis Tools"
                        items={toolItems}
                        onClick={() => setMobileOpen(false)}
                    />
                </nav>

                {/* Admin Portal Quick Link (admin/moderator/support only) */}
                {user && ['admin', 'moderator', 'support'].includes(user.role) && (
                    <div className="px-4 pb-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="group flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20"
                        >
                            <ShieldCheck size={16} />
                            Admin Console
                        </button>
                    </div>
                )}

                {/* Bottom User section */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors group text-left"
                    >
                        {/* Avatar */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-700 border border-slate-200 shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-900 truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {user?.email || ''}
                            </p>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Settings size={16} className="text-slate-400 hover:text-slate-600" />
                        </div>
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ═══ Main Content ═══ */}
            <div className="flex flex-1 flex-col min-w-0 bg-[#FAFAFA]">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:px-8">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2.5 text-[14px]">
                        <span className="hidden sm:inline text-slate-500 font-medium hover:text-slate-700 cursor-pointer transition-colors">{breadcrumbGroup}</span>
                        <ChevronRight size={14} className="hidden sm:inline text-slate-300" />
                        <span className="font-semibold text-slate-900">{pageTitle}</span>
                    </div>

                    <div className="flex-1 flex justify-center px-4 hidden md:flex">
                        {/* Command Bar / Search */}
                        <div 
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 w-full max-w-md bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors text-slate-400 cursor-pointer"
                        >
                            <Search size={15} />
                            <span className="text-[13px]">Search documents, clauses...</span>
                            <div className="ml-auto flex items-center gap-1">
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-sm">⌘</kbd>
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-sm">K</kbd>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 md:hidden" />

                    <div className="flex items-center gap-3">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>
                        
                        {/* Desktop Upload Button */}
                        <NavLink
                            to="/upload"
                            className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg shadow-sm shadow-blue-600/20 transition-all hover:shadow-md hover:-translate-y-px"
                        >
                            <Plus size={16} />
                            New Document
                        </NavLink>

                        {/* User Menu Toggle */}
                        <div className="relative">
                            <button 
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-blue-500/20"
                            >
                                {initials}
                            </button>

                            {/* Dropdown */}
                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1 animate-scale-in">
                                        <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                            <p className="text-[13px] font-semibold text-slate-900 truncate">{user?.name}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                                            className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                        >
                                            <Settings size={15} />
                                            Settings
                                        </button>
                                        <button
                                            onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                                            className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={15} />
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto doc-scroll p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
            <GlobalSearch />
        </div>
    );
}
