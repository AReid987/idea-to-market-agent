
import { db } from '../db';
import { artifactsTable } from '../db/schema';
import { type UpdateArtifactInput, type Artifact } from '../schema';
import { eq } from 'drizzle-orm';

export const updateArtifact = async (input: UpdateArtifactInput): Promise<Artifact> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof artifactsTable.$inferInsert> = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.canvas_position_x !== undefined) updateData.canvas_position_x = input.canvas_position_x;
    if (input.canvas_position_y !== undefined) updateData.canvas_position_y = input.canvas_position_y;
    if (input.canvas_width !== undefined) updateData.canvas_width = input.canvas_width;
    if (input.canvas_height !== undefined) updateData.canvas_height = input.canvas_height;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update artifact record
    const result = await db.update(artifactsTable)
      .set(updateData)
      .where(eq(artifactsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Artifact with id ${input.id} not found`);
    }

    // Convert database result to schema type
    const artifact = result[0];
    return {
      id: artifact.id,
      project_id: artifact.project_id,
      type: artifact.type,
      title: artifact.title,
      content: artifact.content,
      status: artifact.status,
      canvas_position_x: artifact.canvas_position_x,
      canvas_position_y: artifact.canvas_position_y,
      canvas_width: artifact.canvas_width,
      canvas_height: artifact.canvas_height,
      dependencies: artifact.dependencies as number[] | null,
      metadata: artifact.metadata as Record<string, unknown> | null,
      created_at: artifact.created_at,
      updated_at: artifact.updated_at
    };
  } catch (error) {
    console.error('Artifact update failed:', error);
    throw error;
  }
};
