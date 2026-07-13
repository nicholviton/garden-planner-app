export type TaskMonth = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

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

export function getTaskMonthFromDueDate(dueDate?: string): TaskMonth {
  if (!dueDate) return 0;
  const match = dueDate.match(/^\d{4}-(\d{2})-\d{2}$/);
  if (!match) return 0;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return 0;
  return month as TaskMonth;
}

export const TASK_MONTH_OPTIONS: Array<{ value: TaskMonth; label: string }> = [
  { value: 0, label: 'Not set' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];
