
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, teamMembersTable } from '../db/schema';
import { type AddTeamMemberInput } from '../schema';
import { addTeamMember } from '../handlers/add_team_member';
import { eq } from 'drizzle-orm';

describe('addTeamMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a team member', async () => {
    // Create prerequisite team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    const testInput: AddTeamMemberInput = {
      team_id: teamResult[0].id,
      user_name: 'John Doe',
      user_email: 'john@example.com',
      role: 'member'
    };

    const result = await addTeamMember(testInput);

    // Basic field validation
    expect(result.team_id).toEqual(teamResult[0].id);
    expect(result.user_name).toEqual('John Doe');
    expect(result.user_email).toEqual('john@example.com');
    expect(result.role).toEqual('member');
    expect(result.id).toBeDefined();
    expect(result.joined_at).toBeInstanceOf(Date);
  });

  it('should save team member to database', async () => {
    // Create prerequisite team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    const testInput: AddTeamMemberInput = {
      team_id: teamResult[0].id,
      user_name: 'Jane Smith',
      user_email: 'jane@example.com',
      role: 'admin'
    };

    const result = await addTeamMember(testInput);

    // Query using proper drizzle syntax
    const teamMembers = await db.select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, result.id))
      .execute();

    expect(teamMembers).toHaveLength(1);
    expect(teamMembers[0].team_id).toEqual(teamResult[0].id);
    expect(teamMembers[0].user_name).toEqual('Jane Smith');
    expect(teamMembers[0].user_email).toEqual('jane@example.com');
    expect(teamMembers[0].role).toEqual('admin');
    expect(teamMembers[0].joined_at).toBeInstanceOf(Date);
  });

  it('should throw error when team does not exist', async () => {
    const testInput: AddTeamMemberInput = {
      team_id: 999, // Non-existent team ID
      user_name: 'John Doe',
      user_email: 'john@example.com',
      role: 'member'
    };

    await expect(addTeamMember(testInput)).rejects.toThrow(/team with id 999 not found/i);
  });

  it('should handle different team roles correctly', async () => {
    // Create prerequisite team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    const ownerInput: AddTeamMemberInput = {
      team_id: teamResult[0].id,
      user_name: 'Team Owner',
      user_email: 'owner@example.com',
      role: 'owner'
    };

    const viewerInput: AddTeamMemberInput = {
      team_id: teamResult[0].id,
      user_name: 'Team Viewer',
      user_email: 'viewer@example.com',
      role: 'viewer'
    };

    const ownerResult = await addTeamMember(ownerInput);
    const viewerResult = await addTeamMember(viewerInput);

    expect(ownerResult.role).toEqual('owner');
    expect(viewerResult.role).toEqual('viewer');

    // Verify both members are in database
    const teamMembers = await db.select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.team_id, teamResult[0].id))
      .execute();

    expect(teamMembers).toHaveLength(2);
    expect(teamMembers.map(m => m.role)).toContain('owner');
    expect(teamMembers.map(m => m.role)).toContain('viewer');
  });
});
