
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, projectsTable, artifactsTable } from '../db/schema';
import { type GenerateArtifactInput } from '../schema';
import { generateArtifact } from '../handlers/generate_artifact';
import { eq } from 'drizzle-orm';

// Test data setup
let testTeamId: number;
let testProjectId: number;

const setupTestData = async () => {
  // Create test team
  const teamResult = await db.insert(teamsTable)
    .values({
      name: 'Test Team',
      description: 'Team for testing'
    })
    .returning()
    .execute();
  testTeamId = teamResult[0].id;

  // Create test project
  const projectResult = await db.insert(projectsTable)
    .values({
      team_id: testTeamId,
      name: 'Test Project',
      description: 'Project for testing',
      project_brief: 'This is a test project for building a web application'
    })
    .returning()
    .execute();
  testProjectId = projectResult[0].id;
};

describe('generateArtifact', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
  });
  
  afterEach(resetDB);

  it('should generate a basic artifact', async () => {
    const input: GenerateArtifactInput = {
      project_id: testProjectId,
      type: 'prd'
    };

    const result = await generateArtifact(input);

    expect(result.project_id).toEqual(testProjectId);
    expect(result.type).toEqual('prd');
    expect(result.title).toEqual('Product Requirements Document');
    expect(result.content).toContain('Product Requirements Document');
    expect(result.content).toContain('This is a test project for building a web application');
    expect(result.status).toEqual('draft');
    expect(result.canvas_position_x).toEqual(0);
    expect(result.canvas_position_y).toEqual(0);
    expect(result.canvas_width).toEqual(400);
    expect(result.canvas_height).toEqual(300);
    expect(result.dependencies).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should generate artifact with custom canvas position', async () => {
    const input: GenerateArtifactInput = {
      project_id: testProjectId,
      type: 'kanban_board',
      canvas_position_x: 100,
      canvas_position_y: 200
    };

    const result = await generateArtifact(input);

    expect(result.canvas_position_x).toEqual(100);
    expect(result.canvas_position_y).toEqual(200);
    expect(result.type).toEqual('kanban_board');
    expect(result.title).toEqual('Kanban Board');
  });

  it('should save artifact to database', async () => {
    const input: GenerateArtifactInput = {
      project_id: testProjectId,
      type: 'lean_canvas'
    };

    const result = await generateArtifact(input);

    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, result.id))
      .execute();

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].project_id).toEqual(testProjectId);
    expect(artifacts[0].type).toEqual('lean_canvas');
    expect(artifacts[0].title).toEqual('Lean Canvas');
    expect(artifacts[0].status).toEqual('draft');
  });

  it('should generate different content for different artifact types', async () => {
    const prdInput: GenerateArtifactInput = {
      project_id: testProjectId,
      type: 'prd'
    };

    const uiUxInput: GenerateArtifactInput = {
      project_id: testProjectId,
      type: 'ui_ux_spec'
    };

    const prdResult = await generateArtifact(prdInput);
    const uiUxResult = await generateArtifact(uiUxInput);

    expect(prdResult.title).toEqual('Product Requirements Document');
    expect(prdResult.content).toContain('Product Requirements Document');
    expect(prdResult.content).toContain('Features');

    expect(uiUxResult.title).toEqual('UI/UX Specification');
    expect(uiUxResult.content).toContain('UI/UX Specification');
    expect(uiUxResult.content).toContain('User Experience Design');

    expect(prdResult.content).not.toEqual(uiUxResult.content);
  });

  it('should handle project without brief', async () => {
    // Create project without brief
    const projectWithoutBrief = await db.insert(projectsTable)
      .values({
        team_id: testTeamId,
        name: 'Project Without Brief',
        description: 'Test project'
      })
      .returning()
      .execute();

    const input: GenerateArtifactInput = {
      project_id: projectWithoutBrief[0].id,
      type: 'design_system'
    };

    const result = await generateArtifact(input);

    expect(result.content).toContain('No project brief available');
    expect(result.title).toEqual('Design System');
  });

  it('should throw error for non-existent project', async () => {
    const input: GenerateArtifactInput = {
      project_id: 99999,
      type: 'prd'
    };

    await expect(generateArtifact(input)).rejects.toThrow(/Project with ID 99999 not found/);
  });

  it('should generate all artifact types correctly', async () => {
    const artifactTypes = [
      'project_brief',
      'prd',
      'kanban_board',
      'lean_canvas',
      'design_architecture',
      'system_architecture',
      'ui_ux_spec',
      'user_flows',
      'design_system'
    ] as const;

    for (const type of artifactTypes) {
      const input: GenerateArtifactInput = {
        project_id: testProjectId,
        type
      };

      const result = await generateArtifact(input);

      expect(result.type).toEqual(type);
      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.status).toEqual('draft');
    }
  });
});
