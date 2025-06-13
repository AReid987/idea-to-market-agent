
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, projectsTable } from '../db/schema';
import { type GetTeamProjectsInput, type CreateTeamInput, type CreateProjectInput } from '../schema';
import { getTeamProjects } from '../handlers/get_team_projects';

describe('getTeamProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return projects for a team', async () => {
    // Create a team first
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    const teamId = teamResult[0].id;

    // Create projects for the team
    await db.insert(projectsTable)
      .values([
        {
          team_id: teamId,
          name: 'Project 1',
          description: 'First project',
          project_brief: 'Brief for project 1'
        },
        {
          team_id: teamId,
          name: 'Project 2',
          description: 'Second project',
          project_brief: 'Brief for project 2'
        }
      ])
      .execute();

    const input: GetTeamProjectsInput = {
      team_id: teamId
    };

    const result = await getTeamProjects(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Project 1');
    expect(result[0].description).toEqual('First project');
    expect(result[0].project_brief).toEqual('Brief for project 1');
    expect(result[0].team_id).toEqual(teamId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Project 2');
    expect(result[1].description).toEqual('Second project');
    expect(result[1].project_brief).toEqual('Brief for project 2');
    expect(result[1].team_id).toEqual(teamId);
  });

  it('should return empty array for team with no projects', async () => {
    // Create a team without projects
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Empty Team',
        description: 'A team with no projects'
      })
      .returning()
      .execute();

    const input: GetTeamProjectsInput = {
      team_id: teamResult[0].id
    };

    const result = await getTeamProjects(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent team', async () => {
    const input: GetTeamProjectsInput = {
      team_id: 999999 // Non-existent team ID
    };

    const result = await getTeamProjects(input);

    expect(result).toHaveLength(0);
  });

  it('should only return projects for the specified team', async () => {
    // Create two teams
    const team1Result = await db.insert(teamsTable)
      .values({
        name: 'Team 1',
        description: 'First team'
      })
      .returning()
      .execute();

    const team2Result = await db.insert(teamsTable)
      .values({
        name: 'Team 2',
        description: 'Second team'
      })
      .returning()
      .execute();

    const team1Id = team1Result[0].id;
    const team2Id = team2Result[0].id;

    // Create projects for both teams
    await db.insert(projectsTable)
      .values([
        {
          team_id: team1Id,
          name: 'Team 1 Project 1',
          description: 'Project for team 1'
        },
        {
          team_id: team1Id,
          name: 'Team 1 Project 2',
          description: 'Another project for team 1'
        },
        {
          team_id: team2Id,
          name: 'Team 2 Project 1',
          description: 'Project for team 2'
        }
      ])
      .execute();

    const input: GetTeamProjectsInput = {
      team_id: team1Id
    };

    const result = await getTeamProjects(input);

    expect(result).toHaveLength(2);
    expect(result.every(project => project.team_id === team1Id)).toBe(true);
    expect(result.some(project => project.name === 'Team 1 Project 1')).toBe(true);
    expect(result.some(project => project.name === 'Team 1 Project 2')).toBe(true);
    expect(result.some(project => project.name === 'Team 2 Project 1')).toBe(false);
  });
});
