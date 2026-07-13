import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile } from '@/lib/github';
import { getTaskMonthFromDueDate, type SeasonTask, type TaskFormData } from '@/types/task';
import { DEFAULT_SEASON_ID } from '@/types/season';

const TASKS_PATH = 'tasks.json';

function tasksPathForSeason(seasonId: string): string {
  return `seasons/${seasonId}/tasks.json`;
}

function isDefaultSeason(seasonId: string): boolean {
  return seasonId === DEFAULT_SEASON_ID;
}

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

async function readTasks(
  config: GitHubConfig,
  seasonId: string = DEFAULT_SEASON_ID,
  forceLoad: boolean = false,
): Promise<{ tasks: SeasonTask[]; sha?: string; path: string }> {
  const seasonPath = tasksPathForSeason(seasonId);
  const seasonData = await getJsonFile<SeasonTask[]>(config, seasonPath, forceLoad);
  if (seasonData) return { tasks: seasonData.data, sha: seasonData.sha, path: seasonPath };

  if (isDefaultSeason(seasonId)) {
    const legacy = await getJsonFile<SeasonTask[]>(config, TASKS_PATH, forceLoad);
    if (legacy) return { tasks: legacy.data, sha: legacy.sha, path: TASKS_PATH };
  }

  return { tasks: [], path: seasonPath };
}

async function writeTasks(config: GitHubConfig, seasonId: string, tasks: SeasonTask[], sha?: string): Promise<void> {
  await putFile(config, tasksPathForSeason(seasonId), jsonToBase64(tasks), 'Update season tasks', sha);
}

export async function getTasks(config: GitHubConfig, seasonId: string = DEFAULT_SEASON_ID, forceLoad: boolean = false): Promise<SeasonTask[]> {
  const { tasks } = await readTasks(config, seasonId, forceLoad);
  return tasks;
}

export async function overwriteTasks(config: GitHubConfig, tasks: SeasonTask[], seasonId: string = DEFAULT_SEASON_ID): Promise<void> {
  const { sha } = await readTasks(config, seasonId);
  await writeTasks(config, seasonId, tasks, sha);
}

export async function createTask(config: GitHubConfig, data: TaskFormData, seasonId: string = DEFAULT_SEASON_ID): Promise<SeasonTask> {
  const { tasks, sha } = await readTasks(config, seasonId);
  const now = new Date().toISOString();
  const task: SeasonTask = {
    id: uuidv4(),
    seasonId,
    completed: data.completed,
    //month: data.month,
    month: getTaskMonthFromDueDate(data.dueDate),
    details: data.details,
    completedDate: data.completedDate,
    dueDate: data.dueDate,
    createdAt: now,
    updatedAt: now,
  };
  await writeTasks(config, seasonId, [...tasks, task], sha);
  return task;
}

export async function updateTask(
  config: GitHubConfig,
  taskId: string,
  data: TaskFormData,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<SeasonTask> {
  const { tasks, sha } = await readTasks(config, seasonId);
  const now = new Date().toISOString();
  let updated: SeasonTask | undefined;
  const newTasks = tasks.map((task) => {
    if (task.id !== taskId) return task;
    updated = {
      ...task,
      ...data,
      seasonId,
      updatedAt: now,
    };
    return updated;
  });

  if (!updated) throw new Error(`Task ${taskId} not found`);
  await writeTasks(config, seasonId, newTasks, sha);
  return updated;
}

export async function deleteTask(config: GitHubConfig, taskId: string, seasonId: string = DEFAULT_SEASON_ID): Promise<void> {
  const { tasks, sha } = await readTasks(config, seasonId);
  await writeTasks(config, seasonId, tasks.filter((task) => task.id !== taskId), sha);
}
