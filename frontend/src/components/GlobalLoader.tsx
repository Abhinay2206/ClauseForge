import { Scale, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface GlobalLoaderProps {
    message?: string;
    fullScreen?: boolean;
}

export default function GlobalLoader({ message = 'Loading...', fullScreen = true }: GlobalLoaderProps) {
    return (
        <div 
            className={cn(
                "flex flex-col items-center justify-center bg-[#F8FAFC] animate-fade-in z-50",
                fullScreen ? "fixed inset-0 min-h-screen" : "w-full h-full min-h-[300px] rounded-2xl"
            )}
        >
            <div className="flex flex-col items-center gap-4">
                {/* Brand Logo with pulsing effect */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse-slow" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-lg shadow-blue-500/20 ring-4 ring-white">
                        <Scale size={28} className="animate-float" />
                    </div>
                </div>
                
                {/* Loader and Text */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[#2563EB]">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[14px] font-semibold text-[#0F172A] tracking-tight">{message}</span>
                    </div>
                    {fullScreen && (
                        <p className="text-[12px] font-medium text-[#64748B]">ClauseForge Intelligence</p>
                    )}
                </div>
            </div>
        </div>
    );
}
