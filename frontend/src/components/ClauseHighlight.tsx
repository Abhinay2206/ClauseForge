import { useState } from 'react';
import type { Clause } from '@/types';
import { getRiskColor, formatClauseType, cn } from '@/utils/helpers';
import { Info } from 'lucide-react';

interface ClauseHighlightProps {
    clause: Clause;
    isSelected?: boolean;
    onClick?: (clause: Clause) => void;
}

export default function ClauseHighlight({ clause, isSelected, onClick }: ClauseHighlightProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const colors = getRiskColor(clause.riskLevel);

    const borderColor =
        clause.riskLevel === 'high' ? 'border-[#FECACA]'
            : clause.riskLevel === 'medium' ? 'border-[#FDE68A]'
                : 'border-[#BBF7D0]';

    return (
        <span className="relative inline">
            <span
                className={cn(
                    'cursor-pointer rounded px-0.5 transition-all duration-200 border-b-2',
                    colors.bg,
                    borderColor,
                    isSelected ? 'ring-2 ring-[#2563EB] ring-offset-1' : ''
                )}
                onClick={() => onClick?.(clause)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {clause.text}
            </span>

            {showTooltip && (
                <span className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
                    <span className="flex items-center gap-2 mb-1">
                        <Info size={14} className={colors.text} />
                        <span className={cn('text-[12px] font-semibold', colors.text)}>{formatClauseType(clause.type)}</span>
                    </span>
                    <span className="block text-[12px] text-[#6B7280] leading-relaxed">{clause.explanation}</span>
                </span>
            )}
        </span>
    );
}
