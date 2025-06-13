
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { type CreateTeamInput } from '../schema';
import { createTeam } from '../handlers/create_team';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateTeamInput = {
  name: 'Test Team',
  description: 'A team for testing'
};

const testInputWithoutDescription: CreateTeamInput = {
  name: 'Test Team No Description'
};

describe('createTeam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a team with description', async () => {
    const result = await createTeam(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Team');
    expect(result.description).toEqual('A team for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a team without description', async () => {
    const result = await createTeam(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Test Team No Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save team to database', async () => {
    const result = await createTeam(testInput);

    // Query using proper drizzle syntax
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, result.id))
      .execute();

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toEqual('Test Team');
    expect(teams[0].description).toEqual('A team for testing');
    expect(teams[0].created_at).toBeInstanceOf(Date);
    expect(teams[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const result = await createTeam(testInputWithoutDescription);

    // Query database to verify null handling
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, result.id))
      .execute();

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toEqual('Test Team No Description');
    expect(teams[0].description).toBeNull();
  });
});
