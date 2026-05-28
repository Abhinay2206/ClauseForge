import { cn } from '@/utils/helpers';

interface LoadingSkeletonProps {
    className?: string;
    lines?: number;
    variant?: 'text' | 'card' | 'chart' | 'document-card';
}

export default function LoadingSkeleton({
    className,
    lines = 3,
    variant = 'text',
}: LoadingSkeletonProps) {
    if (variant === 'card') {
        return (
            <div className={cn('cf-card p-5', className)}>
                <div className="skeleton h-3 w-20 rounded mb-3" />
                <div className="skeleton h-7 w-28 rounded mb-2" />
                <div className="skeleton h-3 w-16 rounded" />
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div className={cn('cf-card p-4', className)}>
                <div className="skeleton h-4 w-32 rounded mb-2" />
                <div className="skeleton h-3 w-20 rounded mb-6" />
                <div className="skeleton h-52 w-full rounded-lg" />
            </div>
        );
    }

    if (variant === 'document-card') {
        return (
            <div className={cn('cf-card p-5 h-[200px] flex flex-col justify-between', className)}>
                <div>
                    <div className="flex gap-3 mb-4">
                        <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                        <div className="flex-1">
                            <div className="skeleton h-3 w-20 rounded mb-2" />
                            <div className="skeleton h-4 w-full rounded" />
                        </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <div className="skeleton h-5 w-20 rounded-full" />
                        <div className="skeleton h-5 w-24 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                        <div className="skeleton h-3 w-20 rounded" />
                        <div className="skeleton h-3 w-16 rounded" />
                    </div>
                </div>
                <div className="flex gap-1 pt-3 border-t border-[#F1F5F9]">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton h-7 flex-1 rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    // Default: text lines
    const widths = [100, 92, 85, 78, 95, 70, 88, 75, 90, 65, 80, 72, 95, 68, 85, 78, 90, 60, 70, 85, 75, 92];
    return (
        <div className={cn('space-y-2.5', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton h-3.5 rounded"
                    style={{ width: `${widths[i % widths.length]}%` }}
                />
            ))}
        </div>
    );
}
