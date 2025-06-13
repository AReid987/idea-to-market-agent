
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, projectsTable, artifactsTable } from '../db/schema';
import { type GetProjectArtifactsInput } from '../schema';
import { getProjectArtifacts } from '../handlers/get_project_artifacts';

// Test input
const testInput: GetProjectArtifactsInput = {
  project_id: 1
};

describe('getProjectArtifacts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all artifacts for a project', async () => {
    // Create team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'Test team description'
      })
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        team_id: teamResult[0].id,
        name: 'Test Project',
        description: 'Test project description'
      })
      .returning()
      .execute();

    // Create multiple artifacts
    await db.insert(artifactsTable)
      .values([
        {
          project_id: projectResult[0].id,
          type: 'project_brief',
          title: 'Project Brief',
          content: 'Brief content',
          status: 'draft',
          canvas_position_x: 100,
          canvas_position_y: 200,
          canvas_width: 300,
          canvas_height: 400
        },
        {
          project_id: projectResult[0].id,
          type: 'prd',
          title: 'Product Requirements',
          content: 'PRD content',
          status: 'completed',
          canvas_position_x: 500,
          canvas_position_y: 600,
          canvas_width: 700,
          canvas_height: 800,
          dependencies: [1],
          metadata: { version: '1.0' }
        }
      ])
      .execute();

    const result = await getProjectArtifacts({ project_id: projectResult[0].id });

    expect(result).toHaveLength(2);
    
    // First artifact
    expect(result[0].type).toEqual('project_brief');
    expect(result[0].title).toEqual('Project Brief');
    expect(result[0].content).toEqual('Brief content');
    expect(result[0].status).toEqual('draft');
    expect(result[0].canvas_position_x).toEqual(100);
    expect(result[0].canvas_position_y).toEqual(200);
    expect(result[0].canvas_width).toEqual(300);
    expect(result[0].canvas_height).toEqual(400);
    expect(result[0].dependencies).toBeNull();
    expect(result[0].metadata).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Second artifact
    expect(result[1].type).toEqual('prd');
    expect(result[1].title).toEqual('Product Requirements');
    expect(result[1].content).toEqual('PRD content');
    expect(result[1].status).toEqual('completed');
    expect(result[1].canvas_position_x).toEqual(500);
    expect(result[1].canvas_position_y).toEqual(600);
    expect(result[1].canvas_width).toEqual(700);
    expect(result[1].canvas_height).toEqual(800);
    expect(result[1].dependencies).toEqual([1]);
    expect(result[1].metadata).toEqual({ version: '1.0' });
  });

  it('should return empty array for project with no artifacts', async () => {
    // Create team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'Test team description'
      })
      .returning()
      .execute();

    // Create project without artifacts
    const projectResult = await db.insert(projectsTable)
      .values({
        team_id: teamResult[0].id,
        name: 'Empty Project',
        description: 'Project with no artifacts'
      })
      .returning()
      .execute();

    const result = await getProjectArtifacts({ project_id: projectResult[0].id });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getProjectArtifacts({ project_id: 999 });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
