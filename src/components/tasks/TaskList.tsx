import { useState } from 'react';
import { CalendarClock, CheckSquare, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { SeasonTask } from '@/types/task';
import type { TaskMonthFilter, TaskStatusFilter } from '@/hooks/useTasks';
import { TASK_MONTH_OPTIONS } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskForm } from '@/components/forms/TaskForm';

interface TaskListProps {
  tasks: SeasonTask[];
  totalCount: number;
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
  monthFilter: TaskMonthFilter;
  statusFilter: TaskStatusFilter;
  onMonthFilterChange: (value: TaskMonthFilter) => void;
  onStatusFilterChange: (value: TaskStatusFilter) => void;
  onAddTask: (data: Omit<SeasonTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onEditTask: (taskId: string, data: Omit<SeasonTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onRemoveTask: (taskId: string) => Promise<void>;
  onToggleTaskCompleted: (task: SeasonTask, completed: boolean) => Promise<void>;
}

function monthLabel(month: number): string {
  return TASK_MONTH_OPTIONS.find((option) => option.value === month)?.label ?? 'Not set';
}

function isTaskOverdue(task: SeasonTask): boolean {
  if (task.completed || !task.dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today >= task.dueDate;
}

export function TaskList({
  tasks,
  totalCount,
  isLoading,
  isMutating,
  hasConfig,
  monthFilter,
  statusFilter,
  onMonthFilterChange,
  onStatusFilterChange,
  onAddTask,
  onEditTask,
  onRemoveTask,
  onToggleTaskCompleted,
}: TaskListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SeasonTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SeasonTask | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-garden-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
            <span className="text-xs text-gray-500">{totalCount} total</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="task-month-filter">Filter month</label>
            <select
              id="task-month-filter"
              value={monthFilter}
              onChange={(e) => {
                const value = e.target.value;
                onMonthFilterChange(value === 'all' ? 'all' : Number(value) as 0 | 1 | 2 | 3);
              }}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
            >
              <option value="all">All months</option>
              {TASK_MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <label className="text-sm text-gray-600" htmlFor="task-status-filter">Filter done</label>
            <select
              id="task-status-filter"
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                onStatusFilterChange(
                  value === 'done' || value === 'not-done' ? value : 'all',
                );
              }}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
            >
              <option value="all">All</option>
              <option value="done">Done</option>
              <option value="not-done">Not done</option>
            </select>

            <Button variant="primary" size="md" onClick={() => setIsAddOpen(true)} disabled={!hasConfig || isMutating}>
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <CheckSquare className="w-12 h-12 text-garden-300" />
            <p className="text-sm">No tasks for this filter yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 whitespace-nowrap">Done</th>
                  <th className="px-4 py-3 whitespace-nowrap">Completed Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Month</th>
                  <th className="px-4 py-3 w-full">Task</th>
                  <th className="px-4 py-3 whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  return (
                    <tr key={task.id} className={overdue ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-garden-50'}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => { onToggleTaskCompleted(task, e.target.checked).catch(() => {}); }}
                          disabled={isMutating}
                          className="h-4 w-4 rounded border-gray-300 text-garden-600 focus:ring-garden-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{task.completedDate ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{monthLabel(task.month)}</td>
                      <td className={`px-4 py-3 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {task.details}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap ${overdue ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                        <span className="inline-flex items-center gap-1">
                          {task.dueDate ? <CalendarClock className="w-3.5 h-3.5" /> : null}
                          {task.dueDate ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingTask(task)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-garden-600 hover:bg-garden-50 transition-colors"
                            aria-label="Edit task"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(task)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddOpen && (
        <Modal title="New Task" onClose={() => setIsAddOpen(false)}>
          <TaskForm
            onSubmit={async (data) => {
              await onAddTask(data);
              setIsAddOpen(false);
            }}
            onClose={() => setIsAddOpen(false)}
            loading={isMutating}
          />
        </Modal>
      )}

      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <TaskForm
            task={editingTask}
            onSubmit={async (data) => {
              await onEditTask(editingTask.id, data);
              setEditingTask(null);
            }}
            onClose={() => setEditingTask(null)}
            loading={isMutating}
          />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Task?"
          message="This task will be permanently deleted."
          onConfirm={() => {
            onRemoveTask(confirmDelete.id).catch(() => {});
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
