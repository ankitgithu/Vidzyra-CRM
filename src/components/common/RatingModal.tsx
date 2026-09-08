import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Rating } from '../../types';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'client' | 'editor' | 'project';
  targetId: string;
  targetName: string;
  authorRole: 'admin' | 'client' | 'editor';
  authorId: string;
  authorName: string;
  projectId?: string;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  authorRole,
  authorId,
  authorName,
  projectId,
  onSuccess,
}) => {
  const { addRating } = useCrm();

  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [category, setCategory] = useState<'Overall' | 'Quality' | 'Turnaround Time' | 'Communication'>('Overall');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await addRating({
        targetType,
        targetId,
        targetName,
        authorRole,
        authorId,
        authorName,
        score,
        category,
        feedback: feedback.trim(),
        projectId,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rate {targetType === 'editor' ? 'Editor' : targetType === 'client' ? 'Client' : 'Deliverable'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Providing feedback for <strong className="text-slate-800">{targetName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Star Selection */}
          <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Select Star Rating
            </span>
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverScore !== null ? hoverScore : score) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScore(star)}
                    onMouseEnter={() => setHoverScore(star)}
                    onMouseLeave={() => setHoverScore(null)}
                    className="p-1 focus:outline-hidden transition transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition ${
                        filled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-amber-600">
              {score === 5
                ? '5.0 - Outstanding'
                : score === 4
                ? '4.0 - Very Good'
                : score === 3
                ? '3.0 - Satisfactory'
                : score === 2
                ? '2.0 - Needs Improvement'
                : '1.0 - Poor'}
            </span>
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Feedback Category</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Overall', 'Quality', 'Turnaround Time', 'Communication'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-center font-medium border transition cursor-pointer ${
                    category === cat
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Note */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Feedback &amp; Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What went well? Any areas of improvement or notes..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Submit Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
