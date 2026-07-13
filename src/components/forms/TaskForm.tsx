import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { SeasonTask, TaskFormData, TaskMonth } from '@/types/task';
import { TASK_MONTH_OPTIONS } from '@/types/task';

interface TaskFormProps {
  task?: SeasonTask;
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
  loading?: boolean;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TaskForm({ task, onSubmit, onClose, loading = false }: TaskFormProps) {
  const [completed, setCompleted] = useState(task?.completed ?? false);
  const [completedDate, setCompletedDate] = useState(task?.completedDate ?? '');
  const [month, setMonth] = useState<TaskMonth>(task?.month ?? 0);
  const [details, setDetails] = useState(task?.details ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');

  const isValid = details.trim().length > 0;

  function handleCompletedChange(next: boolean) {
    setCompleted(next);
    if (next && !completedDate) {
      setCompletedDate(todayStr());
    }
    if (!next) {
      setCompletedDate('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      completed,
      completedDate: completed ? (completedDate || todayStr()) : undefined,
      month,
      details: details.trim(),
      dueDate: dueDate || undefined,
      seasonId: task?.seasonId,
    });
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => handleCompletedChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-garden-600 focus:ring-garden-500"
        />
        Completed
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date</label>
        <input
          type="date"
          value={completedDate}
          onChange={(e) => setCompletedDate(e.target.value)}
          disabled={!completed}
          className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-500`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value) as TaskMonth)}
          className={inputCls}
        >
          {TASK_MONTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Details <span className="text-red-500">*</span>
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          required
          rows={4}
          placeholder="Describe what needs to be done"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!isValid} loading={loading}>
          {task ? 'Save Changes' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
}
