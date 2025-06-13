
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectBriefInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProjectBrief = async (input: UpdateProjectBriefInput): Promise<Project> => {
  try {
    // Update the project brief
    const result = await db.update(projectsTable)
      .set({
        project_brief: input.project_brief,
        updated_at: new Date()
      })
      .where(eq(projectsTable.id, input.project_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Project brief update failed:', error);
    throw error;
  }
};
