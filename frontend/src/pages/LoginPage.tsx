import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Eye, EyeOff, ShieldAlert, FileSearch, GitCompareArrows, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGoogleLogin } from '@react-oauth/google';

const FEATURES = [
    { icon: FileSearch, text: 'AI-powered clause detection across all contract types' },
    { icon: ShieldAlert, text: 'Real-time risk scoring with plain-language explanations' },
    { icon: GitCompareArrows, text: 'Side-by-side document comparison and change tracking' },
];

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(email, password);
            const currentUser = useAuthStore.getState().user;
            const adminRoles = ['admin', 'moderator', 'support'];
            const target = currentUser && adminRoles.includes(currentUser.role) ? '/admin' : '/dashboard';
            navigate(target, { replace: true });
        } catch {
            setError('Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const googleLoginHook = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError('');
            try {
                await googleLogin({ accessToken: tokenResponse.access_token });
                const currentUser = useAuthStore.getState().user;
                const adminRoles = ['admin', 'moderator', 'support'];
                const target = currentUser && adminRoles.includes(currentUser.role) ? '/admin' : '/dashboard';
                navigate(target, { replace: true });
            } catch {
                setError('Google sign in failed. Please try again.');
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setError('Google Sign In was unsuccessful')
    });

    return (
        <div className="min-h-screen flex bg-[#F8FAFC]">
            {/* ─── Left branding panel ─── */}
            <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden items-center justify-center p-14"
                style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
                }}
            >
                {/* Dot grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* Glow orbs */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-indigo-400/10 blur-3xl" />

                <div className="relative text-white max-w-sm w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Scale size={20} />
                        </div>
                        <span className="text-[18px] font-bold tracking-tight">ClauseForge</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-[32px] font-bold leading-tight tracking-tight mb-4">
                        Legal intelligence for modern teams
                    </h1>
                    <p className="text-[15px] text-white/60 leading-relaxed mb-10">
                        Analyze contracts, detect risks, and make smarter legal decisions powered by AI.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 shrink-0 mt-0.5">
                                    <f.icon size={13} className="text-white/80" />
                                </div>
                                <p className="text-[13px] text-white/70 leading-relaxed">{f.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-center">
                        <div>
                            <p className="text-[24px] font-bold">10K+</p>
                            <p className="text-[12px] text-white/50 mt-0.5">Documents</p>
                        </div>
                        <div>
                            <p className="text-[24px] font-bold">98%</p>
                            <p className="text-[12px] text-white/50 mt-0.5">Accuracy</p>
                        </div>
                        <div>
                            <p className="text-[24px] font-bold">500+</p>
                            <p className="text-[12px] text-white/50 mt-0.5">Law Firms</p>
                        </div>
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

                    <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">Welcome back</h2>
                    <p className="mt-2 text-[14px] text-[#64748B]">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-[13px] font-medium border border-red-100 animate-fade-in">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="flex justify-center mb-4">
                            <button
                                type="button"
                                onClick={() => googleLoginHook()}
                                className="cf-btn cf-btn-outline w-full justify-center transition-all bg-white hover:bg-gray-50 border-[#E2E8F0] text-[#374151]"
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#E2E8F0]"></div>
                            </div>
                            <div className="relative flex justify-center text-[13px]">
                                <span className="bg-[#F8FAFC] px-2 text-[#64748B]">Or continue with email</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                Email address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@company.com"
                                className="cf-input"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
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

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-[13px] text-[#64748B] cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                                />
                                Remember me
                            </label>
                            <button type="button" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            id="login-submit-btn"
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="cf-btn cf-btn-primary cf-btn-lg w-full justify-center transition-all disabled:opacity-60"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin text-white" />
                                    Signing you in securely...
                                </span>
                            ) : (
                                <>
                                    Sign in to your account
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[13px] text-[#64748B]">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
