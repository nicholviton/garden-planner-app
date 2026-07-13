export type TaskMonth = 0 | 1 | 2 | 3;

export interface SeasonTask {
  id: string;
  seasonId?: string;
  completed: boolean;
  completedDate?: string;
  month: TaskMonth;
  details: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskFormData = Omit<SeasonTask, 'id' | 'createdAt' | 'updatedAt'>;

export const TASK_MONTH_OPTIONS: Array<{ value: TaskMonth; label: string }> = [
  { value: 0, label: 'Not set' },
  { value: 1, label: 'Month 1' },
  { value: 2, label: 'Month 2' },
  { value: 3, label: 'Month 3' },
];
