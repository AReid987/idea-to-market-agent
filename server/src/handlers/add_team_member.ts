
import { db } from '../db';
import { teamMembersTable, teamsTable } from '../db/schema';
import { type AddTeamMemberInput, type TeamMember } from '../schema';
import { eq } from 'drizzle-orm';

export const addTeamMember = async (input: AddTeamMemberInput): Promise<TeamMember> => {
  try {
    // Verify team exists before adding member
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, input.team_id))
      .execute();

    if (teams.length === 0) {
      throw new Error(`Team with id ${input.team_id} not found`);
    }

    // Insert team member record
    const result = await db.insert(teamMembersTable)
      .values({
        team_id: input.team_id,
        user_name: input.user_name,
        user_email: input.user_email,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add team member failed:', error);
    throw error;
  }
};
