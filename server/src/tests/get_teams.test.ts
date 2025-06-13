
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { getTeams } from '../handlers/get_teams';

describe('getTeams', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no teams exist', async () => {
    const result = await getTeams();
    expect(result).toEqual([]);
  });

  it('should return all teams', async () => {
    // Create test teams
    await db.insert(teamsTable).values([
      {
        name: 'Team Alpha',
        description: 'First test team'
      },
      {
        name: 'Team Beta',
        description: 'Second test team'
      },
      {
        name: 'Team Gamma',
        description: null
      }
    ]).execute();

    const result = await getTeams();

    expect(result).toHaveLength(3);
    
    // Verify team data
    const teamAlpha = result.find(team => team.name === 'Team Alpha');
    expect(teamAlpha).toBeDefined();
    expect(teamAlpha!.description).toEqual('First test team');
    expect(teamAlpha!.id).toBeDefined();
    expect(teamAlpha!.created_at).toBeInstanceOf(Date);
    expect(teamAlpha!.updated_at).toBeInstanceOf(Date);

    const teamBeta = result.find(team => team.name === 'Team Beta');
    expect(teamBeta).toBeDefined();
    expect(teamBeta!.description).toEqual('Second test team');

    const teamGamma = result.find(team => team.name === 'Team Gamma');
    expect(teamGamma).toBeDefined();
    expect(teamGamma!.description).toBeNull();
  });

  it('should return teams with all required fields', async () => {
    await db.insert(teamsTable).values({
      name: 'Test Team',
      description: 'Test description'
    }).execute();

    const result = await getTeams();

    expect(result).toHaveLength(1);
    const team = result[0];
    
    expect(team.id).toBeDefined();
    expect(typeof team.id).toBe('number');
    expect(team.name).toEqual('Test Team');
    expect(team.description).toEqual('Test description');
    expect(team.created_at).toBeInstanceOf(Date);
    expect(team.updated_at).toBeInstanceOf(Date);
  });
});
