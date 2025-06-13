
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import {
  createTeamInputSchema,
  addTeamMemberInputSchema,
  createProjectInputSchema,
  updateProjectBriefInputSchema,
  generateArtifactInputSchema,
  updateArtifactInputSchema,
  getProjectArtifactsInputSchema,
  getTeamProjectsInputSchema
} from './schema';

import { createTeam } from './handlers/create_team';
import { addTeamMember } from './handlers/add_team_member';
import { createProject } from './handlers/create_project';
import { updateProjectBrief } from './handlers/update_project_brief';
import { generateArtifact } from './handlers/generate_artifact';
import { updateArtifact } from './handlers/update_artifact';
import { getProjectArtifacts } from './handlers/get_project_artifacts';
import { getTeamProjects } from './handlers/get_team_projects';
import { getTeams } from './handlers/get_teams';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Team operations
  createTeam: publicProcedure
    .input(createTeamInputSchema)
    .mutation(({ input }) => createTeam(input)),
  
  addTeamMember: publicProcedure
    .input(addTeamMemberInputSchema)
    .mutation(({ input }) => addTeamMember(input)),
  
  getTeams: publicProcedure
    .query(() => getTeams()),
  
  // Project operations
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  
  updateProjectBrief: publicProcedure
    .input(updateProjectBriefInputSchema)
    .mutation(({ input }) => updateProjectBrief(input)),
  
  getTeamProjects: publicProcedure
    .input(getTeamProjectsInputSchema)
    .query(({ input }) => getTeamProjects(input)),
  
  // Artifact operations
  generateArtifact: publicProcedure
    .input(generateArtifactInputSchema)
    .mutation(({ input }) => generateArtifact(input)),
  
  updateArtifact: publicProcedure
    .input(updateArtifactInputSchema)
    .mutation(({ input }) => updateArtifact(input)),
  
  getProjectArtifacts: publicProcedure
    .input(getProjectArtifactsInputSchema)
    .query(({ input }) => getProjectArtifacts(input))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
