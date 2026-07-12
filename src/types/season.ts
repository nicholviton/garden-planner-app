export interface Season {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export const DEFAULT_SEASON_ID = 'default-season';
export const DEFAULT_SEASON_NAME = 'Default Season';

export function buildDefaultSeason(): Season {
  return {
    id: DEFAULT_SEASON_ID,
    name: DEFAULT_SEASON_NAME,
    order: 0,
    createdAt: new Date(0).toISOString(),
  };
}
