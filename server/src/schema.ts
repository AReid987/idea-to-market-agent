
import { z } from 'zod';

// Enum schemas
export const artifactTypeSchema = z.enum([
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

export const artifactStatusSchema = z.enum([
  'draft',
  'in_progress',
  'completed',
  'reviewed'
]);

export const teamRoleSchema = z.enum([
  'owner',
  'admin',
  'member',
  'viewer'
]);

// Team schema
export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Team = z.infer<typeof teamSchema>;

// Team member schema
export const teamMemberSchema = z.object({
  id: z.number(),
  team_id: z.number(),
  user_name: z.string(),
  user_email: z.string(),
  role: teamRoleSchema,
  joined_at: z.coerce.date()
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  team_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  project_brief: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Artifact schema
export const artifactSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  type: artifactTypeSchema,
  title: z.string(),
  content: z.string(),
  status: artifactStatusSchema,
  canvas_position_x: z.number(),
  canvas_position_y: z.number(),
  canvas_width: z.number(),
  canvas_height: z.number(),
  dependencies: z.array(z.number()).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Artifact = z.infer<typeof artifactSchema>;

// Input schemas
export const createTeamInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export const addTeamMemberInputSchema = z.object({
  team_id: z.number(),
  user_name: z.string().min(1),
  user_email: z.string().email(),
  role: teamRoleSchema
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberInputSchema>;

export const createProjectInputSchema = z.object({
  team_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  project_brief: z.string().nullable().optional()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectBriefInputSchema = z.object({
  project_id: z.number(),
  project_brief: z.string()
});

export type UpdateProjectBriefInput = z.infer<typeof updateProjectBriefInputSchema>;

export const generateArtifactInputSchema = z.object({
  project_id: z.number(),
  type: artifactTypeSchema,
  canvas_position_x: z.number().optional(),
  canvas_position_y: z.number().optional()
});

export type GenerateArtifactInput = z.infer<typeof generateArtifactInputSchema>;

export const updateArtifactInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  status: artifactStatusSchema.optional(),
  canvas_position_x: z.number().optional(),
  canvas_position_y: z.number().optional(),
  canvas_width: z.number().optional(),
  canvas_height: z.number().optional()
});

export type UpdateArtifactInput = z.infer<typeof updateArtifactInputSchema>;

export const getProjectArtifactsInputSchema = z.object({
  project_id: z.number()
});

export type GetProjectArtifactsInput = z.infer<typeof getProjectArtifactsInputSchema>;

export const getTeamProjectsInputSchema = z.object({
  team_id: z.number()
});

export type GetTeamProjectsInput = z.infer<typeof getTeamProjectsInputSchema>;
