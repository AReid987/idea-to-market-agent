
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { type Team } from '../schema';

export const getTeams = async (): Promise<Team[]> => {
  try {
    const results = await db.select()
      .from(teamsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get teams:', error);
    throw error;
  }
};
