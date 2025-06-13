
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, teamsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a team for testing
  const createTestTeam = async () => {
    const result = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a project with all fields', async () => {
    const team = await createTestTeam();
    
    const testInput: CreateProjectInput = {
      team_id: team.id,
      name: 'Test Project',
      description: 'A project for testing',
      project_brief: 'This is a test project brief'
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Test Project');
    expect(result.description).toEqual('A project for testing');
    expect(result.project_brief).toEqual('This is a test project brief');
    expect(result.team_id).toEqual(team.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with minimal fields', async () => {
    const team = await createTestTeam();
    
    const testInput: CreateProjectInput = {
      team_id: team.id,
      name: 'Minimal Project'
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Minimal Project');
    expect(result.description).toBeNull();
    expect(result.project_brief).toBeNull();
    expect(result.team_id).toEqual(team.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const team = await createTestTeam();
    
    const testInput: CreateProjectInput = {
      team_id: team.id,
      name: 'Database Test Project',
      description: 'Testing database persistence',
      project_brief: 'Brief for database test'
    };

    const result = await createProject(testInput);

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Test Project');
    expect(projects[0].description).toEqual('Testing database persistence');
    expect(projects[0].project_brief).toEqual('Brief for database test');
    expect(projects[0].team_id).toEqual(team.id);
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    const team = await createTestTeam();
    
    const testInput: CreateProjectInput = {
      team_id: team.id,
      name: 'Optional Fields Test',
      description: undefined,
      project_brief: undefined
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Optional Fields Test');
    expect(result.description).toBeNull();
    expect(result.project_brief).toBeNull();
    expect(result.team_id).toEqual(team.id);
  });

  it('should throw error for invalid team_id', async () => {
    const testInput: CreateProjectInput = {
      team_id: 999999, // Non-existent team ID
      name: 'Invalid Team Project'
    };

    expect(createProject(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
