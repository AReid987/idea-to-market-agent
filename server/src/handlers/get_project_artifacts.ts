
import { db } from '../db';
import { artifactsTable } from '../db/schema';
import { type GetProjectArtifactsInput, type Artifact } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectArtifacts = async (input: GetProjectArtifactsInput): Promise<Artifact[]> => {
  try {
    const results = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.project_id, input.project_id))
      .execute();

    return results.map(artifact => ({
      ...artifact,
      dependencies: artifact.dependencies as number[] | null,
      metadata: artifact.metadata as Record<string, unknown> | null
    }));
  } catch (error) {
    console.error('Failed to get project artifacts:', error);
    throw error;
  }
};
