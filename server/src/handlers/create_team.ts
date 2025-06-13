
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { type CreateTeamInput, type Team } from '../schema';

export const createTeam = async (input: CreateTeamInput): Promise<Team> => {
  try {
    // Insert team record
    const result = await db.insert(teamsTable)
      .values({
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Team creation failed:', error);
    throw error;
  }
};
