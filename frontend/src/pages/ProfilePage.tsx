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

type ProfileTab = 'general' | 'security';

type PreferenceKey = 'marketing' | 'reports' | 'alerts';

type PreferenceState = Record<PreferenceKey, boolean>;

const tabs: Array<{ id: ProfileTab; label: string; icon: typeof UserIcon }> = [
    { id: 'general', label: 'General', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Shield },
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
    const { user, logout, updateProfile } = useAuthStore();
    const [activeTab, setActiveTab] = useState<ProfileTab>('general');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ name: user?.name || '', email: user?.email || '' });
    const [editError, setEditError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Security states
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

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

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError('');
        setIsSaving(true);
        try {
            await updateProfile(editForm.name, editForm.email);
            setIsEditingProfile(false);
        } catch (error: any) {
            setEditError(error.message);
        }
        setIsSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        setIsChangingPassword(true);
        try {
            await api.put('/api/auth/password', { 
                currentPassword: passwordForm.current, 
                newPassword: passwordForm.new 
            });
            setPasswordSuccess('Password updated successfully');
            setPasswordForm({ current: '', new: '' });
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || 'Failed to update password');
        }
        setIsChangingPassword(false);
    };

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
                        <button 
                            className="cf-btn cf-btn-outline"
                            onClick={() => {
                                setEditForm({ name: user?.name || '', email: user?.email || '' });
                                setIsEditingProfile(true);
                            }}
                        >
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
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            {passwordError && (
                                <div className="rounded-md bg-red-50 p-2 text-[11px] font-medium text-red-700 border border-red-100">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="rounded-md bg-green-50 p-2 text-[11px] font-medium text-green-700 border border-green-100">
                                    {passwordSuccess}
                                </div>
                            )}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter current password"
                                    className="cf-input"
                                    value={passwordForm.current}
                                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter new password"
                                    className="cf-input"
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isChangingPassword}
                                className="cf-btn cf-btn-primary"
                            >
                                {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </Panel>

                    <Panel title="Active Sessions" icon={Activity}>
                        <div className="divide-y divide-slate-100">
                            <div className="flex items-center gap-3 pb-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600">
                                    <Smartphone size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-slate-900">Current device</p>
                                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                        <Clock size={11} />
                                        Last active: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'recently'}
                                    </p>
                                    {user?.lastIpAddress && (
                                        <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                                            IP: {user.lastIpAddress}
                                        </p>
                                    )}
                                </div>
                                <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                                    <CheckCircle2 size={11} />
                                    Active
                                </span>
                            </div>
                        </div>
                    </Panel>
                </div>
            )}

            {isEditingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white shadow-xl animate-scale-in overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-[15px] font-bold text-slate-900">Edit Profile</h2>
                            <button 
                                onClick={() => setIsEditingProfile(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-5">
                            {editError && (
                                <div className="mb-4 rounded-md bg-red-50 p-2.5 text-[12px] font-medium text-red-700 border border-red-100">
                                    {editError}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="cf-input"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="cf-input"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditingProfile(false)}
                                    className="cf-btn cf-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="cf-btn cf-btn-primary"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
