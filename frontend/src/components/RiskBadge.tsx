import { cn } from '@/utils/helpers';
import type { RiskLevel } from '@/types';

interface RiskBadgeProps {
    level: RiskLevel | string;
    size?: 'sm' | 'md' | 'lg';
}

const CONFIGS: Record<string, { label: string; dot: string; badge: string }> = {
    high: {
        label: 'High',
        dot:   'bg-[#DC2626]',
        badge: 'cf-badge cf-badge-high',
    },
    medium: {
        label: 'Medium',
        dot:   'bg-[#D97706]',
        badge: 'cf-badge cf-badge-medium',
    },
    low: {
        label: 'Low',
        dot:   'bg-[#16A34A]',
        badge: 'cf-badge cf-badge-low',
    },
};

export default function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
    const config = CONFIGS[level] ?? CONFIGS['medium'];
    const dotSize = size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2';

    return (
        <span className={cn(config.badge, size === 'sm' && 'text-[10px] px-1.5 py-0.5')}>
            <span className={cn('rounded-full shrink-0', config.dot, dotSize)} />
            {config.label} Risk
        </span>
    );
}
