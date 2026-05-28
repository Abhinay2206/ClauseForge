import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: ReactNode;
    trend?: { value: string; positive: boolean };
    className?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
    return (
        <div className={cn(
            'cf-card cf-card-hover p-5 flex items-start justify-between gap-4',
            className
        )}>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">{title}</p>
                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#0F172A] leading-tight">{value}</p>
                {subtitle && (
                    <p className="mt-1 text-[12px] text-[#64748B]">{subtitle}</p>
                )}
                {trend && (
                    <p className={cn(
                        'mt-2 text-[12px] font-semibold',
                        trend.positive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    )}>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </p>
                )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] shrink-0">
                {icon}
            </div>
        </div>
    );
}
