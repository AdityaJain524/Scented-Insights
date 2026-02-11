import { cn } from '@/lib/utils';

interface CredibilityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function CredibilityBadge({ score, size = 'md', showLabel = false, className }: CredibilityBadgeProps) {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber bg-amber/10 border-amber/30';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-muted-foreground bg-muted border-border';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-1.5 py-0.5';
      case 'lg': return 'text-base px-3 py-1.5';
      default: return 'text-sm px-2 py-1';
    }
  };

  const getLabel = () => {
    if (score >= 80) return 'Highly Trusted';
    if (score >= 60) return 'Trusted';
    if (score >= 40) return 'Building Trust';
    return 'New Contributor';
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center rounded-full border font-semibold',
          getColor(),
          getSizeClasses()
        )}
      >
        {score}%
      </span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{getLabel()}</span>
      )}
    </div>
  );
}
