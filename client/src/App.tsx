
import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { TeamManagement } from '@/components/TeamManagement';
import { ProjectManagement } from '@/components/ProjectManagement';
import type { Team, Project, Artifact } from '../../server/src/schema';

function App() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeTab, setActiveTab] = useState('canvas');

  const loadTeams = useCallback(async () => {
    try {
      const result = await trpc.getTeams.query();
      setTeams(result);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  }, []);

  const loadProjects = useCallback(async (teamId: number) => {
    try {
      const result = await trpc.getTeamProjects.query({ team_id: teamId });
      setProjects(result);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  const loadArtifacts = useCallback(async (projectId: number) => {
    try {
      const result = await trpc.getProjectArtifacts.query({ project_id: projectId });
      setArtifacts(result);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (selectedTeam) {
      loadProjects(selectedTeam.id);
    }
  }, [selectedTeam, loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadArtifacts(selectedProject.id);
    }
  }, [selectedProject, loadArtifacts]);

  const handleTeamChange = (teamId: string) => {
    const team = teams.find((t: Team) => t.id === parseInt(teamId));
    setSelectedTeam(team || null);
    setSelectedProject(null);
    setArtifacts([]);
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === parseInt(projectId));
    setSelectedProject(project || null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                🚀 ProductForge
              </div>
              <div className="text-sm text-gray-600">Multi-Agent Product Development System</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedTeam?.id.toString() || ''} onValueChange={handleTeamChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team: Team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTeam && (
                <Select value={selectedProject?.id.toString() || ''} onValueChange={handleProjectChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {!selectedTeam ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to ProductForge</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your ideas into market-ready products with AI-powered artifact generation and infinite canvas collaboration.
            </p>
            <div className="text-lg text-gray-500">
              Select a team from the dropdown above to get started
            </div>
          </div>
        ) : !selectedProject ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Team: {selectedTeam.name}</h2>
            <p className="text-lg text-gray-600 mb-8">
              {selectedTeam.description || 'Select a project to start generating artifacts'}
            </p>
            <div className="text-lg text-gray-500">
              Choose a project from the dropdown above to continue
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="canvas" className="flex items-center gap-2">
                🎨 Canvas
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                👥 Teams
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                📁 Projects
              </TabsTrigger>
              <TabsTrigger value="artifacts" className="flex items-center gap-2">
                📄 Artifacts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="mt-6">
              <InfiniteCanvas 
                project={selectedProject}
                artifacts={artifacts}
                onArtifactsChange={setArtifacts}
              />
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              <TeamManagement 
                teams={teams}
                selectedTeam={selectedTeam}
                onTeamsChange={setTeams}
              />
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <ProjectManagement 
                team={selectedTeam}
                projects={projects}
                selectedProject={selectedProject}
                onProjectsChange={setProjects}
                onProjectSelect={setSelectedProject}
              />
            </TabsContent>

            <TabsContent value="artifacts" className="mt-6">
              <div className="grid gap-4">
                {artifacts.length === 0 ? (
                  <Card className="text-center py-12 bg-white/50 backdrop-blur-sm">
                    <CardContent>
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-xl font-semibold mb-2">No artifacts yet</h3>
                      <p className="text-gray-600">Switch to the Canvas tab to start generating artifacts for your project</p>
                    </CardContent>
                  </Card>
                ) : (
                  artifacts.map((artifact: Artifact) => (
                    <Card key={artifact.id} className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {getArtifactIcon(artifact.type)}
                            {artifact.title}
                          </CardTitle>
                          <Badge variant={getStatusVariant(artifact.status)}>
                            {artifact.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {formatArtifactType(artifact.type)} • Updated {artifact.updated_at.toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {artifact.content.substring(0, 200)}...
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function getArtifactIcon(type: string): string {
  const iconMap: Record<string, string> = {
    project_brief: '📋',
    prd: '📊',
    kanban_board: '📌',
    lean_canvas: '🎯',
    design_architecture: '🏗️',
    system_architecture: '⚙️',
    ui_ux_spec: '🎨',
    user_flows: '🔄',
    design_system: '🎭'
  };
  return iconMap[type] || '📄';
}

function formatArtifactType(type: string): string {
  return type.split('_').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'completed': return 'default';
    case 'in_progress': return 'secondary';
    case 'reviewed': return 'outline';
    default: return 'outline';
  }
}

export default App;
