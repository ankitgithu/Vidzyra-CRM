import React from 'react';
import { Star } from 'lucide-react';

interface StarDisplayProps {
  score: number;
  maxScore?: number;
  showScoreText?: boolean;
  reviewsCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StarDisplay: React.FC<StarDisplayProps> = ({
  score,
  maxScore = 5,
  showScoreText = true,
  reviewsCount,
  size = 'sm',
}) => {
  const starSizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  const textSizeClass = size === 'lg' ? 'text-sm font-bold' : size === 'md' ? 'text-xs font-semibold' : 'text-[11px] font-medium';

  return (
    <div className="inline-flex items-center gap-1 text-amber-500">
      <div className="flex items-center">
        {Array.from({ length: maxScore }).map((_, idx) => {
          const filled = score >= idx + 1;
          const half = !filled && score >= idx + 0.5;
          return (
            <Star
              key={idx}
              className={`${starSizeClass} ${
                filled
                  ? 'text-amber-400 fill-amber-400'
                  : half
                  ? 'text-amber-400 fill-amber-200'
                  : 'text-slate-200 fill-slate-100'
              }`}
            />
          );
        })}
      </div>
      {showScoreText && (
        <span className={`${textSizeClass} text-slate-700 ml-0.5`}>
          {score.toFixed(1)}
        </span>
      )}
      {reviewsCount !== undefined && (
        <span className="text-[10px] text-slate-400">({reviewsCount})</span>
      )}
    </div>
  );
};
