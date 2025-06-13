
import { serial, text, pgTable, timestamp, integer, jsonb, pgEnum, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const artifactTypeEnum = pgEnum('artifact_type', [
  'project_brief',
  'prd',
  'kanban_board',
  'lean_canvas',
  'design_architecture',
  'system_architecture',
  'ui_ux_spec',
  'user_flows',
  'design_system'
]);

export const artifactStatusEnum = pgEnum('artifact_status', [
  'draft',
  'in_progress',
  'completed',
  'reviewed'
]);

export const teamRoleEnum = pgEnum('team_role', [
  'owner',
  'admin',
  'member',
  'viewer'
]);

// Teams table
export const teamsTable = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Team members table
export const teamMembersTable = pgTable('team_members', {
  id: serial('id').primaryKey(),
  team_id: integer('team_id').notNull().references(() => teamsTable.id, { onDelete: 'cascade' }),
  user_name: varchar('user_name', { length: 255 }).notNull(),
  user_email: varchar('user_email', { length: 255 }).notNull(),
  role: teamRoleEnum('role').notNull(),
  joined_at: timestamp('joined_at').defaultNow().notNull()
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  team_id: integer('team_id').notNull().references(() => teamsTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  project_brief: text('project_brief'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Artifacts table
export const artifactsTable = pgTable('artifacts', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  type: artifactTypeEnum('type').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  status: artifactStatusEnum('status').notNull().default('draft'),
  canvas_position_x: integer('canvas_position_x').notNull().default(0),
  canvas_position_y: integer('canvas_position_y').notNull().default(0),
  canvas_width: integer('canvas_width').notNull().default(400),
  canvas_height: integer('canvas_height').notNull().default(300),
  dependencies: jsonb('dependencies'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const teamsRelations = relations(teamsTable, ({ many }) => ({
  members: many(teamMembersTable),
  projects: many(projectsTable)
}));

export const teamMembersRelations = relations(teamMembersTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [teamMembersTable.team_id],
    references: [teamsTable.id]
  })
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  team: one(teamsTable, {
    fields: [projectsTable.team_id],
    references: [teamsTable.id]
  }),
  artifacts: many(artifactsTable)
}));

export const artifactsRelations = relations(artifactsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [artifactsTable.project_id],
    references: [projectsTable.id]
  })
}));

// TypeScript types
export type Team = typeof teamsTable.$inferSelect;
export type NewTeam = typeof teamsTable.$inferInsert;
export type TeamMember = typeof teamMembersTable.$inferSelect;
export type NewTeamMember = typeof teamMembersTable.$inferInsert;
export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;
export type Artifact = typeof artifactsTable.$inferSelect;
export type NewArtifact = typeof artifactsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  teams: teamsTable,
  teamMembers: teamMembersTable,
  projects: projectsTable,
  artifacts: artifactsTable
};
