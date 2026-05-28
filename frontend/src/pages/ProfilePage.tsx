import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import {
    Activity,
    Bell,
    CheckCircle2,
    Clock,
    CreditCard,
    Globe,
    Key,
    LogOut,
    Mail,
    Shield,
    Smartphone,
    User as UserIcon
} from 'lucide-react';
import { cn } from '@/utils/helpers';

type ProfileTab = 'general' | 'security' | 'billing';

type PreferenceKey = 'marketing' | 'reports' | 'alerts';

type PreferenceState = Record<PreferenceKey, boolean>;

const tabs: Array<{ id: ProfileTab; label: string; icon: typeof UserIcon }> = [
    { id: 'general', label: 'General', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
];

const preferenceRows: Array<{
    key: PreferenceKey;
    title: string;
    description: string;
}> = [
    {
        key: 'reports',
        title: 'Analysis notifications',
        description: 'Send an email when document analysis is complete.',
    },
    {
        key: 'alerts',
        title: 'Security alerts',
        description: 'Notify me about unusual login or account activity.',
    },
    {
        key: 'marketing',
        title: 'Product updates',
        description: 'Receive platform updates and legal AI insights.',
    },
];

function FieldDisplay({ label, value }: { label: string; value?: string }) {
    return (
        <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
            <div className="min-h-8 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-900">
                {value || 'Not set'}
            </div>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                checked ? 'bg-blue-600' : 'bg-slate-200'
            )}
            aria-pressed={checked}
        >
            <span
                className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    checked ? 'translate-x-[18px]' : 'translate-x-0.5'
                )}
            />
        </button>
    );
}

function Panel({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: typeof UserIcon;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                <Icon size={14} className="text-blue-600" />
                <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
            </div>
            <div className="p-3">{children}</div>
        </section>
    );
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<ProfileTab>('general');
    const [preferences, setPreferences] = useState<PreferenceState>({
        marketing: true,
        reports: true,
        alerts: true,
    });

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const { data } = await api.get('/api/email/preferences');
                setPreferences({
                    marketing: Boolean(data.marketing),
                    reports: Boolean(data.reports),
                    alerts: Boolean(data.alerts),
                });
            } catch (err) {
                console.error('Failed to fetch preferences', err);
            }
        };

        fetchPreferences();
    }, []);

    const handlePreferenceChange = async (key: PreferenceKey) => {
        const previousPrefs = preferences;
        const newPrefs = { ...preferences, [key]: !preferences[key] };

        setPreferences(newPrefs);
        try {
            await api.put('/api/email/preferences', newPrefs);
        } catch (err) {
            console.error('Failed to update preferences', err);
            setPreferences(previousPrefs);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="cf-page">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[14px] font-bold text-white">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="mb-0 truncate text-[16px] font-bold text-slate-900">
                                {user?.name || 'User'}
                            </h1>
                            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-slate-500">
                                <Mail size={13} className="shrink-0 text-slate-400" />
                                <span className="truncate">{user?.email || 'user@example.com'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {user?.role || 'user'}
                        </span>
                        <button className="cf-btn cf-btn-outline">
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="flex overflow-x-auto px-2 py-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors',
                                activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                    >
                        <LogOut size={13} />
                        Sign out
                    </button>
                </div>
            </div>

            {activeTab === 'general' && (
                <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
                    <Panel title="Personal Information" icon={UserIcon}>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FieldDisplay label="Full name" value={user?.name} />
                            <FieldDisplay label="Email address" value={user?.email} />
                            <FieldDisplay label="Role" value={user?.role} />
                            <FieldDisplay label="Language" value="English (US)" />
                        </div>
                    </Panel>

                    <Panel title="Preferences" icon={Bell}>
                        <div className="divide-y divide-slate-100">
                            {preferenceRows.map((item) => (
                                <div key={item.key} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                                    <div>
                                        <p className="text-[12px] font-semibold text-slate-900">{item.title}</p>
                                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.description}</p>
                                    </div>
                                    <Toggle
                                        checked={preferences[item.key]}
                                        onChange={() => handlePreferenceChange(item.key)}
                                    />
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="grid gap-3 lg:grid-cols-[420px_1fr]">
                    <Panel title="Password" icon={Key}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current password</label>
                                <input
                                    type="password"
                                    placeholder="Enter current password"
                                    className="cf-input"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    className="cf-input"
                                />
                            </div>
                            <button className="cf-btn cf-btn-primary">
                                Update Password
                            </button>
                        </div>
                    </Panel>

                    <Panel title="Active Sessions" icon={Activity}>
                        <div className="divide-y divide-slate-100">
                            <div className="flex items-center gap-3 pb-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600">
                                    <Smartphone size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-slate-900">Current device</p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">Browser session currently in use</p>
                                </div>
                                <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                                    <CheckCircle2 size={11} />
                                    Active
                                </span>
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                                    <Globe size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-slate-900">Recent web session</p>
                                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                        <Clock size={11} />
                                        Last active 2 days ago
                                    </p>
                                </div>
                                <button className="text-[11px] font-semibold text-slate-500 hover:text-red-600">
                                    Revoke
                                </button>
                            </div>
                        </div>
                    </Panel>
                </div>
            )}

            {activeTab === 'billing' && (
                <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
                    <Panel title="Current Plan" icon={CreditCard}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                    <Shield size={11} />
                                    Professional
                                </div>
                                <h2 className="text-[15px] font-bold text-slate-900">Pro Tier</h2>
                                <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-500">
                                    Advanced AI analysis, unlimited risk assessments, and priority support are enabled for this account.
                                </p>
                            </div>
                            <button className="cf-btn cf-btn-primary">
                                Manage Plan
                            </button>
                        </div>
                    </Panel>

                    <Panel title="Usage" icon={Activity}>
                        <div className="space-y-3">
                            <div>
                                <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-slate-600">
                                    <span>Documents analyzed</span>
                                    <span>42</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-[45%] rounded-full bg-blue-600" />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-slate-600">
                                    <span>Storage</span>
                                    <span>2.4 / 10 GB</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-[24%] rounded-full bg-slate-700" />
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>
            )}
        </div>
    );
}
