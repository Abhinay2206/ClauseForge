import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Scale, FileSearch, ShieldAlert, GitCompareArrows, FileText,
    AlertTriangle, CheckCircle2, ArrowRight, Sparkles,
    Lock, Globe, BarChart3, Users, Star, Menu, X,
    Zap, Shield, Database, Clock, TrendingUp, ChevronRight,
    Activity, Play, Brain, Eye, Upload, Download,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';

/* ══════════════════════════════════════════════════════
   Intersection-reveal hook
══════════════════════════════════════════════════════ */
function useReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

/* ══════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════ */
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const links = [
        { label: 'Features', href: '#features' },
        { label: 'How it works', href: '#workflow' },
        { label: 'Security', href: '#security' },
    ];

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-[100] transition-all duration-500',
                scrolled
                    ? 'bg-white/[0.97] backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]'
                    : 'bg-transparent'
            )}
        >
            <div className="max-w-[1200px] mx-auto px-4 h-[60px] flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 select-none">
                    <div className={cn(
                        'h-8 w-8 rounded-[9px] flex items-center justify-center transition-all',
                        scrolled ? 'bg-[#0F172A]' : 'bg-white/[0.12] border border-white/20 backdrop-blur-sm'
                    )}>
                        <Scale size={14} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className={cn(
                        'text-[15px] font-[750] tracking-[-0.02em] transition-colors',
                        scrolled ? 'text-[#0F172A]' : 'text-white'
                    )}>
                        ClauseForge
                    </span>
                </Link>

                {/* Center nav */}
                <nav className="hidden md:flex items-center gap-0.5">
                    {links.map(l => (
                        <a
                            key={l.label}
                            href={l.href}
                            className={cn(
                                'px-3.5 py-2 text-[13.5px] font-medium rounded-lg transition-colors',
                                scrolled
                                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                            )}
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                {/* Right CTAs */}
                <div className="hidden md:flex items-center gap-2">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className={cn(
                                'h-[34px] px-4 flex items-center gap-1.5 text-[13px] font-[600] rounded-lg transition-all duration-150',
                                scrolled
                                    ? 'bg-[#0F172A] text-white hover:bg-slate-800'
                                    : 'bg-white text-[#0F172A] hover:bg-white/90'
                            )}
                        >
                            Go to Dashboard
                            <ArrowRight size={13} strokeWidth={2.5} />
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={cn(
                                    'px-4 py-2 text-[13px] font-medium rounded-lg transition-colors',
                                    scrolled
                                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                        : 'text-white/65 hover:text-white hover:bg-white/[0.08]'
                                )}
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className={cn(
                                    'h-[34px] px-4 flex items-center gap-1.5 text-[13px] font-[600] rounded-lg transition-all duration-150',
                                    scrolled
                                        ? 'bg-[#0F172A] text-white hover:bg-slate-800'
                                        : 'bg-white text-[#0F172A] hover:bg-white/90'
                                )}
                            >
                                Get started
                                <ArrowRight size={13} strokeWidth={2.5} />
                            </Link>
                        </>
                    )}
                </div>

                <button
                    onClick={() => setMobileOpen(o => !o)}
                    className={cn('md:hidden p-2 rounded-lg', scrolled ? 'text-slate-600' : 'text-white')}
                >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {mobileOpen && (
                <div className="md:hidden bg-white border-b border-slate-200 px-5 py-3 space-y-0.5">
                    {links.map(l => (
                        <a
                            key={l.label}
                            href={l.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2.5 text-[14px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                        >
                            {l.label}
                        </a>
                    ))}
                    <div className="pt-3 grid grid-cols-2 gap-2">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="col-span-2 py-2.5 text-center text-[14px] font-semibold bg-[#0F172A] text-white rounded-lg">Go to Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="py-2.5 text-center text-[14px] font-medium border border-slate-200 rounded-lg text-slate-600">Sign in</Link>
                                <Link to="/signup" className="py-2.5 text-center text-[14px] font-semibold bg-[#0F172A] text-white rounded-lg">Get started</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

/* ══════════════════════════════════════════════════════
   HERO  App preview
══════════════════════════════════════════════════════ */
function AppPreview() {
    return (
        <div className="relative w-full max-w-[1000px] mx-auto mt-16 px-4 lg:px-0">
            {/* Diffused glow */}
            <div
                className="absolute inset-x-16 -bottom-12 h-32 blur-3xl opacity-25 pointer-events-none rounded-full"
                style={{ background: 'radial-gradient(ellipse, #3B82F6, transparent 70%)' }}
            />

            {/* Main app window */}
            <div
                className="relative rounded-[16px] overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.6)',
                }}
            >
                {/* Window bar */}
                <div className="flex items-center gap-3 px-5 h-10 border-b border-white/[0.05] shrink-0">
                    <div className="flex gap-1.5">
                        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                            <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                        ))}
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="h-5 w-52 rounded-md bg-white/[0.05] flex items-center justify-center gap-1.5">
                            <Lock size={8} className="text-white/25" />
                            <span className="text-[9px] text-white/25 font-mono">app.clauseforge.ai/analysis</span>
                        </div>
                    </div>
                </div>

                {/* App body */}
                <div className="flex" style={{ height: 380 }}>
                    {/* Sidebar */}
                    <div className="w-[168px] border-r border-white/[0.05] flex flex-col p-3 shrink-0">
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-4">
                            <div className="h-5 w-5 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                                <Scale size={10} className="text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white/90 tracking-tight">ClauseForge</span>
                        </div>
                        <div className="space-y-0.5">
                            {[
                                { icon: FileText, label: 'Documents', active: false },
                                { icon: FileSearch, label: 'Analysis', active: true },
                                { icon: ShieldAlert, label: 'Risk Analysis', active: false },
                                { icon: GitCompareArrows, label: 'Compare', active: false },
                            ].map(item => (
                                <div
                                    key={item.label}
                                    className={cn(
                                        'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10.5px] font-medium',
                                        item.active
                                            ? 'bg-blue-500/15 text-blue-400'
                                            : 'text-white/28 hover:text-white/50'
                                    )}
                                >
                                    <item.icon size={10} />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col p-4 min-w-0">
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div>
                                <p className="text-[11px] font-semibold text-white/80">Document Analysis</p>
                                <p className="text-[9px] text-white/30 mt-0.5">Master Service Agreement - TechCorp.pdf</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded-full bg-red-500/12 text-red-400 border border-red-500/18">● High Risk</span>
                                <span className="text-[12px] font-bold text-white/55">72<span className="text-[9px] text-white/20">/100</span></span>
                            </div>
                        </div>

                        {/* Alert banner */}
                        <div className="flex-shrink-0 mb-3 rounded-lg bg-amber-500/8 border border-amber-500/18 px-3 py-2">
                            <p className="text-[8.5px] text-amber-300/70 leading-[15px]">
                                ⚠ 3 high-risk clauses detected , asymmetric termination rights, excessive non-compete, above-market liability cap. Legal review required.
                            </p>
                        </div>

                        {/* Two-panel layout */}
                        <div className="flex gap-3 flex-1 min-h-0">
                            {/* Document text */}
                            <div className="flex-1 bg-white/[0.025] border border-white/[0.05] rounded-xl p-3 overflow-hidden">
                                <p className="text-[7.5px] font-semibold uppercase tracking-widest text-white/20 mb-2">Document Content</p>
                                <div className="text-[8.5px] leading-[16px] text-white/35 font-mono">
                                    <p className="text-white/55 font-semibold mb-1">MASTER SERVICE AGREEMENT</p>
                                    <p>This Agreement is entered into as of March 1, 2026, by and between TechCorp Inc. and ServicePro LLC.</p>
                                    <p className="mt-2">1. TERMINATION CLAUSE</p>
                                    <p>Either party may terminate on 30 days notice. However, <span className="bg-red-500/20 text-red-300 px-0.5 rounded">the Client may terminate immediately without notice</span> if benchmarks are missed.</p>
                                    <p className="mt-2"><span className="bg-red-500/20 text-red-300 px-0.5 rounded">penalty of 25% of remaining contract value</span> applies on early exit by Provider.</p>
                                    <p className="mt-2">4. NON-COMPETE</p>
                                    <p>Provider agrees <span className="bg-amber-500/20 text-amber-300 px-0.5 rounded">not to engage in any competing business for 2 years</span> after termination in all jurisdictions.</p>
                                </div>
                            </div>

                            {/* Clauses panel */}
                            <div className="w-[118px] shrink-0 space-y-2">
                                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
                                    <p className="text-[7.5px] text-white/25 uppercase tracking-widest mb-1.5 font-semibold">Detected Clauses</p>
                                    {[
                                        { label: 'Termination', risk: 'high' },
                                        { label: 'Non-Compete', risk: 'high' },
                                        { label: 'Liability Cap', risk: 'medium' },
                                        { label: 'Payment Terms', risk: 'medium' },
                                        { label: 'IP Assignment', risk: 'low' },
                                    ].map(c => (
                                        <div key={c.label} className="flex items-center gap-1.5 py-[5px] border-b border-white/[0.04] last:border-0">
                                            <span className={cn(
                                                'h-1.5 w-1.5 rounded-full shrink-0',
                                                c.risk === 'high' ? 'bg-red-500' : c.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                            )} />
                                            <span className="text-[8px] text-white/38">{c.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-2.5">
                                    <p className="text-[7.5px] text-blue-400/70 uppercase tracking-widest mb-1 font-semibold flex items-center gap-1">
                                        <Sparkles size={7} /> AI Insight
                                    </p>
                                    <p className="text-[8px] text-white/40 leading-[13px]">Non-compete across all jurisdictions for 2 years is likely unenforceable in EU/UK.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating - risk card */}
            <div
                className="absolute -right-3 lg:-right-10 top-16 w-[168px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 animate-fade-in"
                style={{ animationDelay: '600ms' }}
            >
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle size={14} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-[12px] font-bold text-slate-900 leading-tight">3 High Risk</p>
                        <p className="text-[10px] text-slate-400">clauses flagged</p>
                    </div>
                </div>
                <div className="h-[3px] w-full bg-slate-100 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '72%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Risk score: <span className="font-bold text-red-500">72/100</span></p>
            </div>

            {/* Floating - AI insight card */}
            <div
                className="absolute -left-3 lg:-left-10 bottom-20 w-[186px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 animate-fade-in"
                style={{ animationDelay: '800ms' }}
            >
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-[18px] w-[18px] rounded-md bg-blue-50 flex items-center justify-center">
                        <Sparkles size={10} className="text-blue-500" />
                    </div>
                    <p className="text-[9.5px] font-semibold text-blue-600 uppercase tracking-wider">AI Insight</p>
                </div>
                <p className="text-[11.5px] font-[500] text-slate-700 leading-[17px]">
                    Non-compete clause spans 2 years globally , likely unenforceable.
                </p>
                <p className="text-[10.5px] text-blue-600 mt-2 font-semibold flex items-center gap-0.5">
                    View recommendation <ChevronRight size={10} />
                </p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════ */
function Hero() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return (
        <section
            className="relative min-h-screen flex flex-col items-center justify-start pt-[108px] pb-40 overflow-hidden"
            style={{ background: 'linear-gradient(165deg, #060C1A 0%, #0F172A 55%, #0C1525 100%)' }}
        >
            {/* Dot grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.04,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* Top center glow */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[560px] pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.18) 0%, transparent 65%)',
                }}
            />

            <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 flex flex-col items-center text-center">
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.1] bg-white/[0.04] mb-6 animate-fade-slide-up">
                    <span className="h-[5px] w-[5px] rounded-full bg-blue-500 animate-analysis-pulse" />
                    <span className="text-[11.5px] font-medium text-white/55">AI-Powered Legal Document Intelligence</span>
                </div>

                {/* H1 */}
                <h1
                    className="text-[44px] sm:text-[58px] lg:text-[72px] font-[800] text-white leading-[1.04] tracking-[-0.035em] max-w-[900px] animate-fade-slide-up"
                    style={{ animationDelay: '80ms' }}
                >
                    Legal analysis<br />
                    <span
                        style={{
                            background: 'linear-gradient(130deg, #93C5FD 0%, #818CF8 45%, #C084FC 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        at machine speed.
                    </span>
                </h1>

                {/* Subheadline */}
                <p
                    className="mt-6 text-[17px] text-white/48 leading-[1.7] max-w-[560px] animate-fade-slide-up"
                    style={{ animationDelay: '150ms' }}
                >
                    ClauseForge reads your contracts, detects risky clauses, scores risk exposure, and delivers structured legal insights  in seconds.
                </p>

                {/* CTAs */}
                <div
                    className="flex flex-col sm:flex-row items-center gap-3 mt-10 animate-fade-slide-up"
                    style={{ animationDelay: '220ms' }}
                >
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            id="hero-cta-primary"
                            className="group h-11 px-4 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-semibold transition-all duration-150 shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.6),0_8px_30px_rgba(59,130,246,0.35)]"
                        >
                            Go to Dashboard
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    ) : (
                        <Link
                            to="/signup"
                            id="hero-cta-primary"
                            className="group h-11 px-4 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-semibold transition-all duration-150 shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.6),0_8px_30px_rgba(59,130,246,0.35)]"
                        >
                            Start analyzing free
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                    <a
                        href="#workflow"
                        className="h-11 px-4 flex items-center gap-2.5 rounded-xl border border-white/[0.12] text-white/60 text-[14px] font-medium hover:border-white/25 hover:text-white/85 hover:bg-white/[0.04] transition-all duration-150"
                    >
                        <div className="h-5 w-5 rounded-full border border-white/[0.16] bg-white/[0.06] flex items-center justify-center">
                            <Play size={8} className="text-white ml-px" fill="currentColor" />
                        </div>
                        See how it works
                    </a>
                </div>

                {/* App preview */}
                <div className="w-full animate-fade-slide-up" style={{ animationDelay: '360ms' }}>
                    <AppPreview />
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════
   FEATURES  Bento grid
══════════════════════════════════════════════════════ */
function Features() {
    const { ref, visible } = useReveal();

    return (
        <section id="features" className="py-28 bg-slate-50">
            <div
                ref={ref}
                className={cn(
                    'max-w-[1200px] mx-auto px-4 transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                )}
            >
                {/* Section label */}
                <div className="mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-3">Platform</p>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                        <h2 className="text-[36px] lg:text-[44px] font-[800] tracking-[-0.03em] text-slate-900 leading-tight">
                            Everything your legal team<br />needs to move faster.
                        </h2>
                        <p className="text-[15px] text-slate-500 leading-relaxed max-w-sm lg:text-right">
                            Eight purpose-built capabilities, unified in one intelligent workspace.
                        </p>
                    </div>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* Row 1  wide + tall */}
                    {/* AI Analysis  spans 7 cols */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-7 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                            <Brain size={18} className="text-blue-600" />
                        </div>
                        <h3 className="text-[18px] font-[750] text-slate-900 tracking-tight">AI Contract Analysis</h3>
                        <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed max-w-xs">
                            Instantly extract structure, obligations, and risk signals from any legal document using purpose-built legal AI models.
                        </p>
                        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <div className="space-y-2.5">
                                {[
                                    { label: 'Termination Clause', risk: 'High', dot: 'bg-red-500', tag: 'bg-red-50 text-red-600 border-red-100' },
                                    { label: 'Non-Compete', risk: 'High', dot: 'bg-red-500', tag: 'bg-red-50 text-red-600 border-red-100' },
                                    { label: 'Liability Cap', risk: 'Medium', dot: 'bg-amber-500', tag: 'bg-amber-50 text-amber-700 border-amber-100' },
                                    { label: 'IP Assignment', risk: 'Low', dot: 'bg-emerald-500', tag: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                                ].map(c => (
                                    <div key={c.label} className="flex items-center gap-3">
                                        <span className={cn('h-2 w-2 rounded-full shrink-0', c.dot)} />
                                        <span className="text-[13px] text-slate-600 flex-1">{c.label}</span>
                                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', c.tag)}>{c.risk}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Risk Detection  spans 5 cols */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-7 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
                        <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center mb-5">
                            <ShieldAlert size={18} className="text-red-600" />
                        </div>
                        <h3 className="text-[18px] font-[750] text-slate-900 tracking-tight">Clause Risk Detection</h3>
                        <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed">
                            Surface hidden risks across termination, liability, non-compete, and payment clauses with instant severity scoring.
                        </p>
                        <div className="mt-5 space-y-2.5">
                            {[
                                { title: 'Immediate Termination Right', sub: 'No cure period  review urgently', bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-600', dot: 'bg-red-500' },
                                { title: '25% Exit Penalty Clause', sub: 'Above-market  negotiate down', bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-600', dot: 'bg-amber-500' },
                            ].map(r => (
                                <div key={r.title} className={cn('rounded-xl border p-3.5 flex items-start gap-3', r.bg, r.border)}>
                                    <span className={cn('h-2 w-2 rounded-full shrink-0 mt-1', r.dot)} />
                                    <div>
                                        <p className={cn('text-[12px] font-semibold', r.icon)}>{r.title}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{r.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Row 2 */}
                    {/* Smart Summaries  spans 5 cols */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-7 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
                        <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center mb-5">
                            <FileSearch size={18} className="text-cyan-600" />
                        </div>
                        <h3 className="text-[18px] font-[750] text-slate-900 tracking-tight">Smart Summaries</h3>
                        <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed">
                            Plain-language executive summaries of complex agreements. Understand any contract without reading every clause.
                        </p>
                        <div className="mt-5 rounded-xl bg-cyan-50 border border-cyan-100 p-4">
                            <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles size={10} /> AI Executive Summary
                            </p>
                            <p className="text-[12.5px] text-slate-700 leading-relaxed">
                                This MSA heavily favors the Client. Key risks: one-sided termination, 25% exit penalty, and a 2-year global non-compete. Recommend renegotiating sections 1 and 4 before signing.
                            </p>
                        </div>
                    </div>

                    {/* Document Comparison  spans 7 cols */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-7 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
                        <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center mb-5">
                            <GitCompareArrows size={18} className="text-violet-600" />
                        </div>
                        <h3 className="text-[18px] font-[750] text-slate-900 tracking-tight">Document Comparison</h3>
                        <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed">
                            Compare contract versions side-by-side. Every addition, deletion, and modification surfaced instantly.
                        </p>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            {['v1.0  Original', 'v2.0  Revised'].map((v, i) => (
                                <div key={v} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[10px] font-semibold text-slate-400 mb-2">{v}</p>
                                    <div className="space-y-1.5">
                                        <div className="h-2 w-full rounded-full bg-slate-200" />
                                        <div className={cn(
                                            'h-2 rounded-full',
                                            i === 0 ? 'bg-red-200 w-3/4' : 'bg-emerald-200 w-full'
                                        )} />
                                        <div className="h-2 w-5/6 rounded-full bg-slate-200" />
                                        <div className={cn(
                                            'h-2 rounded-full',
                                            i === 0 ? 'bg-red-200 w-2/3' : 'bg-emerald-200 w-4/5'
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Added</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Removed</span>
                        </div>
                    </div>

                    {/* Row 3  4 equal cards */}
                    {[
                        { icon: Activity, bg: 'bg-amber-50', ic: 'text-amber-600', title: 'Compliance Insights', desc: 'Flag clauses that may violate jurisdictional rules, usury laws, or industry-specific regulations.' },
                        { icon: Eye, bg: 'bg-emerald-50', ic: 'text-emerald-600', title: 'Obligation Extraction', desc: "Map every party's obligations, deadlines, and deliverables into a structured actionable list." },
                        { icon: Database, bg: 'bg-slate-100', ic: 'text-slate-600', title: 'Secure Workspace', desc: 'AES-256 encryption. Your legal data never leaves your compliance perimeter.' },
                        { icon: TrendingUp, bg: 'bg-blue-50', ic: 'text-blue-600', title: 'AI Recommendations', desc: 'Actionable negotiation recommendations for every risky clause, grounded in legal precedent.' },
                    ].map(f => (
                        <div key={f.title} className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
                            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center mb-4', f.bg)}>
                                <f.icon size={16} className={f.ic} />
                            </div>
                            <h3 className="text-[14px] font-[700] text-slate-900 tracking-tight">{f.title}</h3>
                            <p className="text-[12.5px] text-slate-500 mt-1.5 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════
   WORKFLOW
══════════════════════════════════════════════════════ */
function Workflow() {
    const { ref, visible } = useReveal();

    const steps = [
        { n: '01', icon: Upload, title: 'Upload', desc: 'Drop any PDF, DOCX, or TXT contract. Encrypted in transit.', color: '#2563EB' },
        { n: '02', icon: Brain, title: 'AI Analysis', desc: 'Legal AI identifies structure, parties, clauses, and obligations.', color: '#7C3AED' },
        { n: '03', icon: ShieldAlert, title: 'Risk Detection', desc: 'Every clause scored. High-risk issues flagged immediately.', color: '#DC2626' },
        { n: '04', icon: Sparkles, title: 'Insights', desc: 'Plain-language summaries and negotiation recommendations.', color: '#D97706' },
        { n: '05', icon: Download, title: 'Export', desc: 'Download structured reports for clients or internal review.', color: '#16A34A' },
    ];

    return (
        <section id="workflow" className="py-28 bg-white">
            <div
                ref={ref}
                className={cn(
                    'max-w-[1200px] mx-auto px-4 transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                )}
            >
                <div className="mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-3">How it works</p>
                    <h2 className="text-[36px] lg:text-[44px] font-[800] tracking-[-0.03em] text-slate-900">
                        From upload to insight<br />
                        <span className="text-slate-400 font-[400]">in under 30 seconds.</span>
                    </h2>
                </div>

                <div className="relative">
                    {/* Connector line */}
                    <div className="hidden lg:block absolute h-px bg-slate-200 left-[calc(10%+28px)] right-[calc(10%+28px)]" style={{ top: '28px' }} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 relative z-10">
                        {steps.map((s, i) => (
                            <div key={s.n} className="flex flex-col items-center text-center">
                                <div
                                    className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 bg-white border-2 shadow-sm shrink-0"
                                    style={{ borderColor: s.color + '33' }}
                                >
                                    <s.icon size={22} style={{ color: s.color }} />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: s.color }}>{s.n}</p>
                                <h3 className="text-[14px] font-[700] text-slate-900 mb-1.5">{s.title}</h3>
                                <p className="text-[12.5px] text-slate-500 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════
   WHY CLAUSEFORGE  dark section
══════════════════════════════════════════════════════ */
function WhyUs() {
    const { ref, visible } = useReveal();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const items = [
        { icon: Zap, title: '10× Faster Reviews', desc: 'Analyze a 50-page contract in under 30 seconds. Cut manual review from hours to minutes.', c: '#D97706', bg: '#FFFBEB' },
        { icon: Shield, title: 'Risk-First Design', desc: 'Every feature is built around surfacing legal risk before it becomes a costly business problem.', c: '#DC2626', bg: '#FEF2F2' },
        { icon: Globe, title: 'Multi-Jurisdiction', desc: 'Legal models trained on US, UK, EU, and APAC frameworks  jurisdiction-aware out of the box.', c: '#2563EB', bg: '#EFF6FF' },
        { icon: Users, title: 'Team Collaboration', desc: 'Share results, annotate documents, and collaborate across your legal team in a unified workspace.', c: '#7C3AED', bg: '#F5F3FF' },
        { icon: BarChart3, title: 'Portfolio Analytics', desc: 'Aggregate risk views across hundreds of contracts with trend analysis and compliance dashboards.', c: '#0891B2', bg: '#ECFEFF' },
    ];

    return (
        <section
            className="py-28 relative overflow-hidden"
            style={{ background: 'linear-gradient(165deg, #060C1A 0%, #0F172A 100%)' }}
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.035,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />
            <div
                ref={ref}
                className={cn(
                    'relative z-10 max-w-[1200px] mx-auto px-4 transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                )}
            >
                <div className="mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-3">Why ClauseForge</p>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                        <h2 className="text-[36px] lg:text-[44px] font-[800] tracking-[-0.03em] text-white leading-tight">
                            Built for legal professionals.<br />
                            <span className="text-white/30 font-[400]">Not general AI users.</span>
                        </h2>
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="h-10 px-5 flex items-center gap-2 rounded-xl border border-white/[0.12] text-white/60 text-[13px] font-medium hover:border-white/25 hover:text-white hover:bg-white/[0.04] transition-all self-start lg:self-end shrink-0"
                            >
                                Go to Dashboard <ArrowRight size={13} />
                            </Link>
                        ) : (
                            <Link
                                to="/signup"
                                className="h-10 px-5 flex items-center gap-2 rounded-xl border border-white/[0.12] text-white/60 text-[13px] font-medium hover:border-white/25 hover:text-white hover:bg-white/[0.04] transition-all self-start lg:self-end shrink-0"
                            >
                                Get started free <ArrowRight size={13} />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                        <div
                            key={item.title}
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 hover:bg-white/[0.055] hover:border-white/[0.1] transition-all duration-200 group"
                        >
                            <div
                                className="h-9 w-9 rounded-xl flex items-center justify-center mb-5"
                                style={{ background: item.bg + '18', border: `1px solid ${item.c}18` }}
                            >
                                <item.icon size={17} style={{ color: item.c }} />
                            </div>
                            <h3 className="text-[15px] font-[700] text-white mb-2 tracking-tight">{item.title}</h3>
                            <p className="text-[13px] text-white/40 leading-relaxed group-hover:text-white/50 transition-colors">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════
   SECURITY
══════════════════════════════════════════════════════ */
function Security() {
    const { ref, visible } = useReveal();

    const items = [
        { icon: Lock, label: 'AES-256 Encryption', desc: 'Data encrypted at rest and in transit' },
        { icon: Users, label: 'Role-Based Access', desc: 'Granular permission management' },
        { icon: Activity, label: 'Audit Logs', desc: 'Complete activity trail for every action' },
        { icon: Database, label: 'Data Isolation', desc: 'Strict tenant-level separation' },
        { icon: Clock, label: '99.99% Uptime', desc: 'Enterprise SLA with global redundancy' },
        { icon: Eye, label: 'Zero-Knowledge', desc: 'We cannot read your documents' },
    ];

    return (
        <section id="security" className="py-28 bg-slate-50">
            <div
                ref={ref}
                className={cn(
                    'max-w-[1200px] mx-auto px-4 transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                )}
            >
                <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
                    {/* Left */}
                    <div className="lg:col-span-4 mb-14 lg:mb-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-3">Security</p>
                        <h2 className="text-[24px] font-[800] tracking-[-0.03em] text-slate-900 leading-tight mb-4">
                            Enterprise-grade<br />security by default.
                        </h2>
                        <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
                            Every architectural decision in ClauseForge prioritizes the security and confidentiality of your legal documents.
                        </p>
                    </div>

                    {/* Right grid */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(item => (
                            <div key={item.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start gap-3.5 shadow-sm">
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <item.icon size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-[650] text-slate-900">{item.label}</p>
                                    <p className="text-[12px] text-slate-500 mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════ */
function Testimonials() {
    const { ref, visible } = useReveal();

    const testimonials = [
        {
            quote: "",
            name: '',
            role: '',
            company: '',
            avatar: '',
            hue: 210,
        },
        {
            quote: "",
            name: '',
            role: '',
            company: '',
            avatar: '',
            hue: 280,
        },
        {
            quote: "",
            name: '',
            role: ' ',
            company: '  ',
            avatar: '   ',
            hue: 160,
        },
    ];

    return (
        <section className="py-28 bg-white">
            <div
                ref={ref}
                className={cn(
                    'max-w-[1200px] mx-auto px-4 transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                )}
            >
                <div className="mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-3">Client Stories</p>
                    <h2 className="text-[36px] lg:text-[44px] font-[800] tracking-[-0.03em] text-slate-900">
                        Used by teams who<br />
                        <span className="text-slate-400 font-[400]">can't afford to miss anything.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {testimonials.map(t => (
                        <div
                            key={t.name}
                            className="bg-white rounded-2xl border border-slate-200/80 p-7 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                        >
                            <div className="flex gap-0.5 mb-5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-[14px] text-slate-600 leading-relaxed flex-1 mb-6">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                                <div
                                    className="h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                                    style={{ background: `hsl(${t.hue}, 60%, 48%)` }}
                                >
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-[13px] font-[650] text-slate-900">{t.name}</p>
                                    <p className="text-[11.5px] text-slate-400">{t.role} · {t.company}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


/* ══════════════════════════════════════════════════════
   FINAL CTA
══════════════════════════════════════════════════════ */
function FinalCTA() {
    const { ref, visible } = useReveal();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return (
        <section
            className="py-36 relative overflow-hidden"
            style={{ background: 'linear-gradient(165deg, #060C1A 0%, #0F172A 100%)' }}
        >
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 65%)' }}
            />
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.035,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />
            <div
                ref={ref}
                className={cn(
                    'relative z-10 max-w-[720px] mx-auto px-4 text-center transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                )}
            >
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-5">Get started</p>
                <h2 className="text-[40px] lg:text-[58px] font-[800] tracking-[-0.04em] text-white leading-[1.04] mb-6">
                    Start analyzing contracts
                    <br />
                    <span className="text-white/30">intelligently.</span>
                </h2>
                <p className="text-[16px] text-white/45 leading-relaxed mb-10 max-w-[480px] mx-auto">
                    Join 500+ law firms and legal teams using ClauseForge to review faster, catch risks earlier, and deliver better outcomes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="group h-12 px-7 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[15px] font-semibold transition-all shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_8px_24px_rgba(59,130,246,0.22)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_10px_32px_rgba(59,130,246,0.32)]"
                        >
                            Go to Dashboard
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/signup"
                                id="cta-final-signup"
                                className="group h-12 px-7 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[15px] font-semibold transition-all shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_8px_24px_rgba(59,130,246,0.22)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_10px_32px_rgba(59,130,246,0.32)]"
                            >
                                Start for free
                                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                to="/login"
                                className="h-12 px-7 flex items-center gap-2 rounded-xl border border-white/[0.1] text-white/55 text-[15px] font-medium hover:border-white/22 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                            >
                                Sign in to your account
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
function Footer() {
    const cols = [
        { heading: 'Product', links: ['Features', 'Workflow', 'Security', 'Pricing', 'Changelog', 'API'] },
        { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
        { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'DPA', 'Cookie Policy', 'Security'] },
        { heading: 'Resources', links: ['Documentation', 'API Reference', 'Status Page', 'Support', 'Community'] },
    ];

    return (
        <footer className="bg-[#060C1A] border-t border-white/[0.06]">
            <div className="max-w-[1200px] mx-auto px-4">
                <div className="py-16 grid grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="h-7 w-7 rounded-[8px] bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                                <Scale size={13} className="text-white" />
                            </div>
                            <span className="text-[14px] font-[750] text-white tracking-tight">ClauseForge</span>
                        </div>
                        <p className="text-[12.5px] text-white/30 leading-relaxed mb-5 max-w-[160px]">
                            AI-powered legal document intelligence for modern teams.
                        </p>
                    </div>

                    {cols.map(col => (
                        <div key={col.heading}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/22 mb-4">{col.heading}</p>
                            <ul className="space-y-2.5">
                                {col.links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-[12.5px] text-white/35 hover:text-white/70 transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="py-5 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11.5px] text-white/22">
                        © {new Date().getFullYear()} ClauseForge, Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5">
                        {['Privacy', 'Terms', 'Security'].map(l => (
                            <a key={l} href="#" className="text-[11.5px] text-white/22 hover:text-white/50 transition-colors">
                                {l}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

/* ══════════════════════════════════════════════════════
   PAGE ROOT
══════════════════════════════════════════════════════ */
export default function LandingPage() {
    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => { document.documentElement.style.scrollBehavior = ''; };
    }, []);

    return (
        <div className="antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Navbar />
            <Hero />
            <Features />
            <Workflow />
            <WhyUs />
            <Security />
            <Testimonials />
            <FinalCTA />
            <Footer />
        </div>
    );
}
