
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, projectsTable, artifactsTable } from '../db/schema';
import { type UpdateArtifactInput } from '../schema';
import { updateArtifact } from '../handlers/update_artifact';
import { eq } from 'drizzle-orm';

describe('updateArtifact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let teamId: number;
  let projectId: number;
  let artifactId: number;

  beforeEach(async () => {
    // Create prerequisite team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'Team for testing'
      })
      .returning()
      .execute();
    teamId = teamResult[0].id;

    // Create prerequisite project
    const projectResult = await db.insert(projectsTable)
      .values({
        team_id: teamId,
        name: 'Test Project',
        description: 'Project for testing'
      })
      .returning()
      .execute();
    projectId = projectResult[0].id;

    // Create prerequisite artifact
    const artifactResult = await db.insert(artifactsTable)
      .values({
        project_id: projectId,
        type: 'prd',
        title: 'Original Title',
        content: 'Original content',
        status: 'draft',
        canvas_position_x: 100,
        canvas_position_y: 200,
        canvas_width: 400,
        canvas_height: 300
      })
      .returning()
      .execute();
    artifactId = artifactResult[0].id;
  });

  it('should update artifact title', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId,
      title: 'Updated Title'
    };

    const result = await updateArtifact(input);

    expect(result.id).toEqual(artifactId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.status).toEqual('draft'); // Should remain unchanged
  });

  it('should update artifact content and status', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId,
      content: 'Updated content with new details',
      status: 'in_progress'
    };

    const result = await updateArtifact(input);

    expect(result.id).toEqual(artifactId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Updated content with new details');
    expect(result.status).toEqual('in_progress');
  });

  it('should update canvas position and dimensions', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId,
      canvas_position_x: 500,
      canvas_position_y: 600,
      canvas_width: 800,
      canvas_height: 600
    };

    const result = await updateArtifact(input);

    expect(result.id).toEqual(artifactId);
    expect(result.canvas_position_x).toEqual(500);
    expect(result.canvas_position_y).toEqual(600);
    expect(result.canvas_width).toEqual(800);
    expect(result.canvas_height).toEqual(600);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId,
      title: 'Completely Updated Title',
      content: 'Completely updated content',
      status: 'completed',
      canvas_position_x: 300,
      canvas_position_y: 400
    };

    const result = await updateArtifact(input);

    expect(result.id).toEqual(artifactId);
    expect(result.title).toEqual('Completely Updated Title');
    expect(result.content).toEqual('Completely updated content');
    expect(result.status).toEqual('completed');
    expect(result.canvas_position_x).toEqual(300);
    expect(result.canvas_position_y).toEqual(400);
    expect(result.canvas_width).toEqual(400); // Should remain unchanged
    expect(result.canvas_height).toEqual(300); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId,
      title: 'Database Test Title',
      status: 'reviewed'
    };

    await updateArtifact(input);

    // Verify changes were persisted
    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, artifactId))
      .execute();

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].title).toEqual('Database Test Title');
    expect(artifacts[0].status).toEqual('reviewed');
    expect(artifacts[0].content).toEqual('Original content'); // Should remain unchanged
  });

  it('should update the updated_at timestamp', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId,
      title: 'Timestamp Test'
    };

    // Get original timestamp
    const originalArtifact = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, artifactId))
      .execute();
    const originalTimestamp = originalArtifact[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await updateArtifact(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTimestamp).toBe(true);
  });

  it('should throw error for non-existent artifact', async () => {
    const input: UpdateArtifactInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updateArtifact(input)).rejects.toThrow(/artifact with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const input: UpdateArtifactInput = {
      id: artifactId
    };

    const result = await updateArtifact(input);

    expect(result.id).toEqual(artifactId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date); // Should still be updated
  });
});
