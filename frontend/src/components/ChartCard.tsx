import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}

export default function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
    return (
        <div className={cn('rounded-2xl border border-[#E5E7EB] bg-white p-4', className)}>
            <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-[#1F2937]">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[13px] text-[#6B7280]">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}
