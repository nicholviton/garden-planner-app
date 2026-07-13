import { useEffect, useMemo, useState } from 'react';
import type { GitHubConfig } from '@/lib/github';
import type { SeasonTask, TaskFormData, TaskMonth } from '@/types/task';
import { createTask, deleteTask, getTasks, updateTask } from '@/lib/taskStorage';

export type TaskMonthFilter = 'all' | TaskMonth;
export type TaskStatusFilter = 'all' | 'done' | 'not-done';

function toDueDateValue(task: SeasonTask): string {
  return task.dueDate ?? '9999-12-31';
}

export function useTasks(config: GitHubConfig | null, seasonId: string) {
  const [tasks, setTasks] = useState<SeasonTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<TaskMonthFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');

  async function loadTasks(cfg: GitHubConfig, forceLoad: boolean = false) {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getTasks(cfg, seasonId, forceLoad);
      setTasks(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!config) {
      setTasks([]);
      return;
    }
    loadTasks(config);
  }, [config, seasonId]);

  useEffect(() => {
    setMonthFilter('all');
    setStatusFilter('all');
  }, [seasonId]);

  async function addTask(data: TaskFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await createTask(config, data, seasonId);
      await loadTasks(config, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function editTask(taskId: string, data: TaskFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await updateTask(config, taskId, data, seasonId);
      await loadTasks(config, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function removeTask(taskId: string) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await deleteTask(config, taskId, seasonId);
      await loadTasks(config, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function toggleTaskCompleted(task: SeasonTask, completed: boolean) {
    const completedDate = completed
      ? task.completedDate ?? new Date().toISOString().slice(0, 10)
      : undefined;

    await editTask(task.id, {
      seasonId,
      completed,
      completedDate,
      month: task.month,
      details: task.details,
      dueDate: task.dueDate,
    });
  }

  const displayTasks = useMemo(() => {
    const monthFiltered = monthFilter === 'all'
      ? tasks
      : tasks.filter((task) => task.month === monthFilter);

    const filtered = statusFilter === 'all'
      ? monthFiltered
      : monthFiltered.filter((task) => (statusFilter === 'done' ? task.completed : !task.completed));

    return [...filtered].sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      const dueCmp = toDueDateValue(a).localeCompare(toDueDateValue(b));
      if (dueCmp !== 0) return dueCmp;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [tasks, monthFilter, statusFilter]);

  return {
    tasks: displayTasks,
    totalCount: tasks.length,
    isLoading,
    isMutating,
    error,
    monthFilter,
    setMonthFilter,
    statusFilter,
    setStatusFilter,
    addTask,
    editTask,
    removeTask,
    toggleTaskCompleted,
  };
}
