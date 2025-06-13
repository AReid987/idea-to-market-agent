
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    const result = await db.insert(projectsTable)
      .values({
        team_id: input.team_id,
        name: input.name,
        description: input.description || null,
        project_brief: input.project_brief || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};
