
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, projectsTable } from '../db/schema';
import { type UpdateProjectBriefInput } from '../schema';
import { updateProjectBrief } from '../handlers/update_project_brief';
import { eq } from 'drizzle-orm';

describe('updateProjectBrief', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update project brief successfully', async () => {
    // Create team first
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        team_id: teamResult[0].id,
        name: 'Test Project',
        description: 'A project for testing',
        project_brief: 'Original brief'
      })
      .returning()
      .execute();

    const input: UpdateProjectBriefInput = {
      project_id: projectResult[0].id,
      project_brief: 'Updated project brief with new requirements'
    };

    const result = await updateProjectBrief(input);

    // Verify returned project
    expect(result.id).toEqual(projectResult[0].id);
    expect(result.project_brief).toEqual('Updated project brief with new requirements');
    expect(result.name).toEqual('Test Project');
    expect(result.team_id).toEqual(teamResult[0].id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > projectResult[0].updated_at).toBe(true);
  });

  it('should save updated brief to database', async () => {
    // Create team first
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        team_id: teamResult[0].id,
        name: 'Test Project',
        description: 'A project for testing',
        project_brief: 'Original brief'
      })
      .returning()
      .execute();

    const input: UpdateProjectBriefInput = {
      project_id: projectResult[0].id,
      project_brief: 'Updated project brief'
    };

    await updateProjectBrief(input);

    // Verify database was updated
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectResult[0].id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].project_brief).toEqual('Updated project brief');
    expect(projects[0].updated_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at > projectResult[0].updated_at).toBe(true);
  });

  it('should throw error for non-existent project', async () => {
    const input: UpdateProjectBriefInput = {
      project_id: 99999,
      project_brief: 'This should fail'
    };

    await expect(updateProjectBrief(input)).rejects.toThrow(/Project with id 99999 not found/i);
  });

  it('should handle empty project brief', async () => {
    // Create team first
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        team_id: teamResult[0].id,
        name: 'Test Project',
        description: 'A project for testing',
        project_brief: 'Original brief'
      })
      .returning()
      .execute();

    const input: UpdateProjectBriefInput = {
      project_id: projectResult[0].id,
      project_brief: ''
    };

    const result = await updateProjectBrief(input);

    expect(result.project_brief).toEqual('');
    expect(result.id).toEqual(projectResult[0].id);
  });
});
