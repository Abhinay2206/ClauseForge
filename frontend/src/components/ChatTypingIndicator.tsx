import { Loader2, Sparkles, Search, Database } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface ChatTypingIndicatorProps {
    phase?: 'searching' | 'analyzing' | 'generating';
}

export default function ChatTypingIndicator({ phase = 'generating' }: ChatTypingIndicatorProps) {
    const renderPhaseContent = () => {
        switch (phase) {
            case 'searching':
                return (
                    <div className="flex items-center gap-2 text-[#64748B] animate-pulse">
                        <Search size={14} className="text-[#2563EB]" />
                        <span className="text-[12px] font-medium tracking-wide">Searching documents...</span>
                    </div>
                );
            case 'analyzing':
                return (
                    <div className="flex items-center gap-2 text-[#64748B] animate-pulse">
                        <Database size={14} className="text-[#7C3AED]" />
                        <span className="text-[12px] font-medium tracking-wide">Analyzing context...</span>
                    </div>
                );
            case 'generating':
            default:
                return (
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[#2563EB] animate-pulse" />
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex max-w-[85%] self-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center shrink-0 mr-3 shadow-sm ring-2 ring-white">
                <Sparkles size={14} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-5 py-3.5 bg-white border border-[#E2E8F0] shadow-sm flex items-center min-w-[120px]">
                {renderPhaseContent()}
            </div>
        </div>
    );
}
