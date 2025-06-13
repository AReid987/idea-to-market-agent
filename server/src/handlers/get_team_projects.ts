
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type GetTeamProjectsInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const getTeamProjects = async (input: GetTeamProjectsInput): Promise<Project[]> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.team_id, input.team_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get team projects:', error);
    throw error;
  }
};
