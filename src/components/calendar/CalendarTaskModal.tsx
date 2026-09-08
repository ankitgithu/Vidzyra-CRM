import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag, Flag, CheckCircle2 } from 'lucide-react';
import { CalendarTask, CalendarTaskPriority, CalendarTaskType, CalendarTaskStatus } from '../../types';
import { normalizeDateStr, getTodayDateStr } from '../../utils/calendarUtils';

interface CalendarTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<CalendarTask, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<CalendarTask>) => Promise<void>;
  initialDate?: string;
  taskToEdit?: CalendarTask | null;
}

export const CalendarTaskModal: React.FC<CalendarTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialDate,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<CalendarTaskPriority>('Medium');
  const [type, setType] = useState<CalendarTaskType>('To-Do');
  const [status, setStatus] = useState<CalendarTaskStatus>('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setDate(normalizeDateStr(taskToEdit.date) || getTodayDateStr());
      setTime(taskToEdit.time || '');
      setPriority(taskToEdit.priority || 'Medium');
      setType(taskToEdit.type || 'To-Do');
      setStatus(taskToEdit.status || 'Pending');
    } else {
      setTitle('');
      setDescription('');
      setDate(initialDate ? normalizeDateStr(initialDate) : getTodayDateStr());
      setTime('');
      setPriority('Medium');
      setType('To-Do');
      setStatus('Pending');
    }
    setErrorMessage(null);
  }, [taskToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }
    if (!date) {
      setErrorMessage('Date is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (taskToEdit && onUpdate) {
        await onUpdate(taskToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          date: normalizeDateStr(date),
          time: time.trim() || undefined,
          priority,
          type,
          status,
        });
      } else {
        await onSave({
          title: title.trim(),
          description: description.trim(),
          date: normalizeDateStr(date),
          time: time.trim() || undefined,
          priority,
          type,
          status,
        });
      }
      onClose();
    } catch (err) {
      setErrorMessage('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const taskTypes: CalendarTaskType[] = [
    'To-Do',
    'Reminder',
    'Follow-up',
    'Meeting',
    'Personal/Admin Task',
  ];

  const priorities: CalendarTaskPriority[] = ['Low', 'Medium', 'High'];

  return (
    <div
      id="calendar-task-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="calendar-task-modal-content"
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {taskToEdit ? 'Edit Calendar Task' : 'New Calendar Task'}
              </h2>
              <p className="text-xs text-slate-500">
                {taskToEdit
                  ? 'Update task details and schedule'
                  : 'Add a to-do, reminder, or administrative follow-up'}
              </p>
            </div>
          </div>
          <button
            id="close-task-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-600">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Client follow-up call, Review draft 2..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="task-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Time (Optional)
              </label>
              <div className="relative">
                <input
                  id="task-time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Type & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category / Type
              </label>
              <select
                id="task-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as CalendarTaskType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {taskTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as CalendarTaskPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (if editing) */}
          {taskToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Pending')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    status === 'Pending'
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Completed')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    status === 'Completed'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              id="task-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context, agenda, or reference points..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              id="cancel-task-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-task-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : taskToEdit ? (
                'Save Changes'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
