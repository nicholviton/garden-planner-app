import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Loader2, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { SeasonTask, TaskFormData, TaskMonth } from '@/types/task';
import type { TaskMonthFilter, TaskStatusFilter } from '@/hooks/useTasks';
import { TASK_MONTH_OPTIONS } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskForm } from '@/components/forms/TaskForm';
import { getTaskMonthFromDueDate } from '@/types/task';

interface TaskListProps {
  allTasks: SeasonTask[];
  totalCount: number;
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
  seasonId: string;
  monthFilter: TaskMonthFilter;
  statusFilter: TaskStatusFilter;
  onMonthFilterChange: (value: TaskMonthFilter) => void;
  onStatusFilterChange: (value: TaskStatusFilter) => void;
  onCommitTasks: (tasks: SeasonTask[]) => Promise<boolean>;
}

function isTaskOverdue(task: SeasonTask): boolean {
  if (task.completed || !task.dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today >= task.dueDate;
}

function toDueDateValue(task: SeasonTask): string {
  return task.dueDate ?? '9999-12-31';
}

function toCompletedDateValue(task: SeasonTask): string {
  return task.completedDate ?? '9999-12-31';
}

function formatMonthDay(dateValue?: string): string {
  if (!dateValue) return '—';
  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateValue;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function filterAndSortTasks(
  tasks: SeasonTask[],
  monthFilter: TaskMonthFilter,
  statusFilter: TaskStatusFilter,
): SeasonTask[] {
  const monthFiltered = monthFilter === 'all'
    ? tasks
    : tasks.filter((task) => task.month === monthFilter);

  const filtered = statusFilter === 'all'
    ? monthFiltered
    : monthFiltered.filter((task) => (statusFilter === 'done' ? task.completed : !task.completed));

  return [...filtered].sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    if (a.completed !== b.completed) return a.completed ? -1 : 1;
    const completedCmp = toCompletedDateValue(a).localeCompare(toCompletedDateValue(b));
    if (completedCmp !== 0) return completedCmp;
    const dueCmp = toDueDateValue(a).localeCompare(toDueDateValue(b));
    if (dueCmp !== 0) return dueCmp;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function cloneTasks(tasks: SeasonTask[]): SeasonTask[] {
  return tasks.map((task) => ({ ...task }));
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function TaskList({
  allTasks,
  totalCount,
  isLoading,
  isMutating,
  hasConfig,
  seasonId,
  monthFilter,
  statusFilter,
  onMonthFilterChange,
  onStatusFilterChange,
  onCommitTasks,
}: TaskListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTasks, setDraftTasks] = useState<SeasonTask[] | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SeasonTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SeasonTask | null>(null);

  const workingTasks = isEditing && draftTasks ? draftTasks : allTasks;

  const statusFilteredTasks = useMemo(() => {
    if (statusFilter === 'all') return workingTasks;
    return workingTasks.filter((task) => (statusFilter === 'done' ? task.completed : !task.completed));
  }, [workingTasks, statusFilter]);

  const availableMonths = useMemo(() => {
    const months = new Set<TaskMonth>();
    for (const task of statusFilteredTasks) {
      months.add(task.month);
    }
    return TASK_MONTH_OPTIONS.filter((option) => months.has(option.value));
  }, [statusFilteredTasks]);

  useEffect(() => {
    if (monthFilter === 'all') return;
    if (availableMonths.some((option) => option.value === monthFilter)) return;
    onMonthFilterChange('all');
  }, [monthFilter, availableMonths, onMonthFilterChange]);

  const tasks = useMemo(
    () => filterAndSortTasks(workingTasks, monthFilter, statusFilter),
    [workingTasks, monthFilter, statusFilter],
  );

  function closeTaskModals() {
    setIsAddOpen(false);
    setEditingTask(null);
    setConfirmDelete(null);
  }

  function startEditMode() {
    setDraftTasks(cloneTasks(allTasks));
    setIsEditing(true);
  }

  function cancelEditMode() {
    setDraftTasks(null);
    setIsEditing(false);
    closeTaskModals();
  }

  async function doneEditMode() {
    if (!draftTasks) return;
    const success = await onCommitTasks(draftTasks);
    if (success) {
      setDraftTasks(null);
      setIsEditing(false);
      closeTaskModals();
    }
  }

  function patchDraftTask(taskId: string, patch: Partial<SeasonTask>) {
    setDraftTasks((prev) => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      return prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          ...patch,
          updatedAt: now,
        };
      });
    });
  }

  function handleAddLocalTask(data: TaskFormData) {
    const now = new Date().toISOString();
    const task: SeasonTask = {
      id: makeId(),
      seasonId,
      completed: data.completed,
      completedDate: data.completed ? data.completedDate ?? new Date().toISOString().slice(0, 10) : undefined,
      month: getTaskMonthFromDueDate(data.dueDate),
      details: data.details,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
    };

    setDraftTasks((prev) => (prev ? [...prev, task] : [task]));
    setIsAddOpen(false);
  }

  function handleEditLocalTask(taskId: string, data: TaskFormData) {
    patchDraftTask(taskId, {
      completed: data.completed,
      completedDate: data.completed ? data.completedDate ?? new Date().toISOString().slice(0, 10) : undefined,
      month: getTaskMonthFromDueDate(data.dueDate),
      details: data.details,
      dueDate: data.dueDate,
      seasonId,
    });
    setEditingTask(null);
  }

  function handleToggleLocalCompleted(task: SeasonTask, completed: boolean) {
    patchDraftTask(task.id, {
      completed,
      completedDate: completed
        ? task.completedDate ?? new Date().toISOString().slice(0, 10)
        : undefined,
    });
  }

  function handleRemoveLocalTask(taskId: string) {
    setDraftTasks((prev) => prev ? prev.filter((task) => task.id !== taskId) : prev);
  }

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
            {isEditing ? (
              <>
                <Button variant="primary" size="md" onClick={() => setIsAddOpen(true)} disabled={!hasConfig || isMutating}>
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
                <Button variant="secondary" size="md" onClick={cancelEditMode} disabled={isMutating}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => { doneEditMode().catch(() => {}); }} loading={isMutating}>
                  <Lock className="w-4 h-4" />
                  Done
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="md" onClick={startEditMode} disabled={!hasConfig || isMutating}>
                <Pencil className="w-4 h-4" />
                Edit Tasks
              </Button>
            )}

            <label className="text-sm text-gray-600" htmlFor="task-month-filter">Filter month</label>
            <select
              id="task-month-filter"
              value={monthFilter}
              onChange={(e) => {
                const value = e.target.value;
                onMonthFilterChange(value === 'all' ? 'all' : Number(value) as TaskMonth);
              }}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
            >
              <option value="all">All months</option>
              {availableMonths.map((option) => (
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
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-garden-50 border border-garden-200 text-sm text-garden-700">
            <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Editing - changes are local until you click <strong>Done</strong>.</span>
          </div>
        )}

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
                  <th className="px-4 py-3 whitespace-nowrap"></th>
                  <th className="px-4 py-3 w-full">Task</th>
                  <th className="px-4 py-3 whitespace-nowrap">Due</th>
                  <th className="px-4 py-3 whitespace-nowrap">Done</th>
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
                          onChange={(e) => handleToggleLocalCompleted(task, e.target.checked)}
                          disabled={!isEditing || isMutating}
                          className="h-4 w-4 rounded border-gray-300 text-garden-600 focus:ring-garden-500"
                        />
                      </td>
                      <td className={`px-4 py-3 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {task.details}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap ${overdue ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                        <span className="inline-flex items-center gap-1">
                          {formatMonthDay(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatMonthDay(task.completedDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingTask(task)}
                              disabled={isMutating}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-garden-600 hover:bg-garden-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Edit task"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(task)}
                              disabled={isMutating}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
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
            onSubmit={(data) => {
              handleAddLocalTask(data);
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
            onSubmit={(data) => {
              handleEditLocalTask(editingTask.id, data);
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
            handleRemoveLocalTask(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
