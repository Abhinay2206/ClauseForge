import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const handleHomeClick = () => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        
        const adminRoles = ['admin', 'moderator', 'support'];
        if (user && adminRoles.includes(user.role)) {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans selection:bg-blue-100 selection:text-blue-900">
            <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-slide-up">
                {/* 404 Illustration */}
                <div className="relative mb-8">
                    <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-sm border border-blue-100/50">
                        <FileQuestion size={48} className="text-blue-500/80" />
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                        <span className="text-[14px] font-bold text-slate-400">4</span>
                    </div>
                    <div className="absolute -bottom-2 -left-4 h-12 w-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
                        <span className="text-[16px] font-bold text-slate-400">4</span>
                    </div>
                    <div className="absolute top-1/2 -right-6 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center -translate-y-1/2 animate-pulse">
                        <span className="text-[12px] font-bold text-slate-400">0</span>
                    </div>
                </div>

                {/* Text Content */}
                <h1 className="text-[32px] font-bold tracking-tight text-slate-900 mb-3">
                    Page not found
                </h1>
                <p className="text-[15px] text-slate-500 mb-10 leading-relaxed max-w-[280px]">
                    The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4 px-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="cf-btn cf-btn-secondary flex-1 justify-center h-11 text-[14px]"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                    <button
                        onClick={handleHomeClick}
                        className="cf-btn cf-btn-primary flex-1 justify-center h-11 text-[14px]"
                    >
                        <Home size={16} />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
