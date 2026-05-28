import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
    User as UserIcon,
    Mail,
    Shield,
    Bell,
    CreditCard,
    Key,
    Activity,
    LogOut,
    CheckCircle2,
    Clock,
    Smartphone,
    Globe
} from 'lucide-react';
import { cn } from '@/utils/helpers';

export default function ProfilePage() {
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'billing'>('general');

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const tabs = [
        { id: 'general', label: 'General', icon: UserIcon },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    ] as const;

    return (
        <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                {/* Background Pattern */}
                <div className="absolute inset-0 h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
                
                <div className="relative pt-16 px-4 sm:px-10 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-4">
                    <div className="relative group">
                        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white p-1 shadow-md">
                            <div className="h-full w-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-3xl font-bold text-white tracking-wider">
                                {initials}
                            </div>
                        </div>
                        <button className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                            <UserIcon size={16} />
                        </button>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            {user?.name || 'User Name'}
                        </h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 text-gray-500 font-medium">
                            <Mail size={15} className="text-gray-400" />
                            {user?.email || 'user@example.com'}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none cf-btn cf-btn-secondary cf-btn-md">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-3 sticky top-6">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                                        activeTab === tab.id
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <tab.icon size={18} className={cn(
                                        "transition-colors",
                                        activeTab === tab.id ? "text-blue-600" : "text-gray-400"
                                    )} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} className="text-red-500" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            {/* Personal Information */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <UserIcon size={18} className="text-blue-600" />
                                    Personal Information
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-gray-500">Full Name</label>
                                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                                            {user?.name}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-gray-500">Email Address</label>
                                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                                            {user?.email}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-gray-500">Role</label>
                                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium capitalize">
                                            {user?.role || 'User'}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-gray-500">Language</label>
                                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                                            English (US)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Bell size={18} className="text-blue-600" />
                                    Preferences
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-medium text-gray-900">Email Notifications</span>
                                            <span className="text-[13px] text-gray-500">Receive analysis completion alerts</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-medium text-gray-900">Weekly Reports</span>
                                            <span className="text-[13px] text-gray-500">Summary of your workspace activity</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            {/* Password Settings */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Key size={18} className="text-blue-600" />
                                    Password
                                </h2>
                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-gray-700">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-gray-700">New Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                                    </div>
                                    <button className="cf-btn cf-btn-primary cf-btn-md mt-2">
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            {/* Active Sessions */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Activity size={18} className="text-blue-600" />
                                    Active Sessions
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                                        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                            <Smartphone size={20} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-semibold text-gray-900">MacBook Pro (Current)</p>
                                            <p className="text-[13px] text-gray-500 mt-0.5">San Francisco, CA • Safari</p>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-green-600 bg-green-100/50 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 size={12} />
                                            Active
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 shrink-0">
                                            <Globe size={20} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-semibold text-gray-900">Windows PC</p>
                                            <p className="text-[13px] text-gray-500 mt-0.5">New York, NY • Chrome</p>
                                            <p className="text-[12px] text-gray-400 mt-1 flex items-center gap-1">
                                                <Clock size={12} /> Last active 2 days ago
                                            </p>
                                        </div>
                                        <button className="shrink-0 text-[13px] font-medium text-gray-500 hover:text-red-600 transition-colors">
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            {/* Current Plan */}
                            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl shadow-lg p-4 sm:p-5 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-5 opacity-10 transform translate-x-4 -translate-y-4">
                                    <CreditCard size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-[12px] font-medium mb-4">
                                        <Shield size={12} />
                                        Professional Plan
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Pro Tier</h2>
                                    <p className="text-slate-300 text-[14px] max-w-md mb-6 leading-relaxed">
                                        You have full access to advanced AI analysis, unlimited risk assessments, and priority support.
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-4">
                                        <button className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-[14px] hover:bg-gray-50 transition-colors">
                                            Manage Subscription
                                        </button>
                                        <span className="text-slate-400 text-[13px]">
                                            Renews on Oct 24, 2026
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-6">Current Usage</h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[14px]">
                                            <span className="font-medium text-gray-700">Documents Analyzed</span>
                                            <span className="font-semibold text-gray-900">42 / Unlimited</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full w-[45%]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[14px]">
                                            <span className="font-medium text-gray-700">Cloud Storage</span>
                                            <span className="font-semibold text-gray-900">2.4 GB / 10 GB</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full w-[24%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
