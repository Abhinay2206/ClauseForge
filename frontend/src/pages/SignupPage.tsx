import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
    'AI-powered clause detection and risk scoring',
    'Side-by-side document comparison',
    'Interactive AI legal chat assistant',
    'Comprehensive exportable risk reports',
];

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { signup } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setIsLoading(true);
        try {
            await signup(name, email, password);
            navigate('/dashboard', { replace: true });
        } catch {
            setError('Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#F8FAFC]">
            {/* ─── Left branding panel ─── */}
            <div
                className="hidden lg:flex lg:w-[46%] relative overflow-hidden items-center justify-center p-14"
                style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
                }}
            >
                {/* Dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-400/10 blur-3xl" />

                <div className="relative text-white max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Scale size={20} />
                        </div>
                        <span className="text-[18px] font-bold tracking-tight">ClauseForge</span>
                    </div>

                    <h1 className="text-[32px] font-bold leading-tight tracking-tight mb-4">
                        Join thousands of legal professionals
                    </h1>
                    <p className="text-[15px] text-white/60 leading-relaxed mb-10">
                        Start analyzing contracts with enterprise-grade AI in minutes.
                    </p>

                    <div className="space-y-3.5">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 shrink-0">
                                    <CheckCircle2 size={12} className="text-white/70" />
                                </div>
                                <p className="text-[13px] text-white/70">{f}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-14 pt-8 border-t border-white/10">
                        <p className="text-[12px] text-white/40">Trusted by 500+ law firms worldwide</p>
                    </div>
                </div>
            </div>

            {/* ─── Right form panel ─── */}
            <div className="flex flex-1 flex-col items-center justify-center p-8">
                <div className="w-full max-w-[400px]">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white">
                            <Scale size={18} />
                        </div>
                        <span className="text-[16px] font-bold tracking-tight text-[#0F172A]">ClauseForge</span>
                    </div>

                    <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">Create your account</h2>
                    <p className="mt-2 text-[14px] text-[#64748B]">Get started with AI-powered legal analysis</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-[13px] font-medium border border-red-100 animate-fade-in">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Full name</label>
                            <input
                                id="signup-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                                className="cf-input"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Email address</label>
                            <input
                                id="signup-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@company.com"
                                className="cf-input"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Min. 6 characters"
                                    className="cf-input pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Confirm password</label>
                            <input
                                id="signup-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Repeat your password"
                                className="cf-input"
                            />
                        </div>

                        <button
                            id="signup-submit-btn"
                            type="submit"
                            disabled={isLoading || !name || !email || !password || !confirmPassword}
                            className="cf-btn cf-btn-primary cf-btn-lg w-full justify-center transition-all disabled:opacity-60"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={18} className="animate-spin text-white" />
                                    Creating your secure account...
                                </span>
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[13px] text-[#64748B]">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
