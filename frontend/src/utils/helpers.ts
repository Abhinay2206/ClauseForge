import { clsx, type ClassValue } from 'clsx';
import type { RiskLevel } from '@/types';

/** Merge class names. */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/** Light-mode-only risk color map using the specified palette. */
export function getRiskColor(level: RiskLevel) {
    const map: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
        low: {
            bg: 'bg-[#DCFCE7]',
            text: 'text-[#16A34A]',
            border: 'border-[#BBF7D0]',
            dot: 'bg-[#16A34A]',
        },
        medium: {
            bg: 'bg-[#FEF3C7]',
            text: 'text-[#D97706]',
            border: 'border-[#FDE68A]',
            dot: 'bg-[#D97706]',
        },
        high: {
            bg: 'bg-[#FEE2E2]',
            text: 'text-[#DC2626]',
            border: 'border-[#FECACA]',
            dot: 'bg-[#DC2626]',
        },
    };
    return map[level];
}

/** Format a file size in human-readable form. */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/** Format an ISO date string. */
export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Truncate text with ellipsis. */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
}

/** Capitalize first letter. */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format clause type for display (e.g. "non-compete" → "Non Compete"). */
export function formatClauseType(type: string): string {
    return type
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
