import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, className, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1F2937]/30 backdrop-blur-sm" onClick={onClose} />
            <div className={cn('relative w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-xl', sizeClasses[size], className)}>
                {title && (
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
                        <h2 className="text-[16px] font-semibold text-[#1F2937]">{title}</h2>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}
