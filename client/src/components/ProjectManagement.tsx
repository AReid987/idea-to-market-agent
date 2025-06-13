
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Team, Project, CreateProjectInput, UpdateProjectBriefInput } from '../../../server/src/schema';

interface ProjectManagementProps {
  team: Team;
  projects: Project[];
  selectedProject: Project | null;
  onProjectsChange: (projects: Project[]) => void;
  onProjectSelect: (project: Project) => void;
}

export function ProjectManagement({ 
  team, 
  projects, 
  selectedProject, 
  onProjectsChange, 
  onProjectSelect 
}: ProjectManagementProps) {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isUpdatingBrief, setIsUpdatingBrief] = useState(false);
  const [newProjectData, setNewProjectData] = useState<CreateProjectInput>({
    team_id: team.id,
    name: '',
    description: null,
    project_brief: null
  });
  const [briefData, setBriefData] = useState('');

  const createProject = async () => {
    setIsCreatingProject(true);
    try {
      const project = await trpc.createProject.mutate(newProjectData);
      onProjectsChange([...projects, project]);
      setNewProjectData({
        team_id: team.id,
        name: '',
        description: null,
        project_brief: null
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const updateProjectBrief = async () => {
    if (!selectedProject) return;
    
    setIsUpdatingBrief(true);
    try {
      const input: UpdateProjectBriefInput = {
        project_id: selectedProject.id,
        project_brief: briefData
      };
      
      await trpc.updateProjectBrief.mutate(input);
      
      const updatedProjects = projects.map((p: Project) =>
        p.id === selectedProject.id 
          ? { ...p, project_brief: briefData }
          : p
      );
      onProjectsChange(updatedProjects);
      onProjectSelect({ ...selectedProject, project_brief: briefData });
      setBriefData('');
    } catch (error) {
      console.error('Failed to update project brief:', error);
    } finally {
      setIsUpdatingBrief(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Project Section */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📁 Project Management
          </CardTitle>
          <CardDescription>
            Create and manage projects for {team.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                ➕ Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new product development project for your team
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    placeholder="e.g., Mobile Banking App"
                    value={newProjectData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewProjectData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="Brief description of the project goals and scope"
                    value={newProjectData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewProjectData((prev: CreateProjectInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Initial Project Brief (Optional)</label>
                  <Textarea
                    placeholder="High-level overview of the project vision, goals, and success criteria"
                    value={newProjectData.project_brief || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewProjectData((prev: CreateProjectInput) => ({
                        ...prev,
                        project_brief: e.target.value || null
                      }))
                    }
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                
                <Button 
                  onClick={createProject}
                  disabled={isCreatingProject || !newProjectData.name.trim()}
                  className="w-full"
                >
                  {isCreatingProject ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card className="text-center py-12 bg-white/30 backdrop-blur-sm">
            <CardContent>
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-600">Create your first project to start the product development journey</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project: Project) => (
            <Card 
              key={project.id} 
              className={`bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer ${
                selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    📁 {project.name}
                    {selectedProject?.id === project.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    Created {project.created_at.toLocaleDateString()}
                  </div>
                </div>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                {project.project_brief ? (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Project Brief:</div>
                    <div className="text-sm text-blue-700 line-clamp-3">
                      {project.project_brief}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-sm text-gray-600">No project brief yet</div>
                    <div className="text-xs text-gray-500">Add a brief to enable AI artifact generation</div>
                  </div>
                )}
                
                {selectedProject?.id === project.id && (
                  <div className="mt-4 pt-4 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          ✏️ {project.project_brief ? 'Update' : 'Add'} Project Brief
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {project.project_brief ? 'Update' : 'Add'} Project Brief
                          </DialogTitle>
                          <DialogDescription>
                            The project brief serves as the foundation for AI-generated artifacts. 
                            Include vision, goals, target audience, and success criteria.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-sm font-medium">Project Brief</label>
                            <Textarea
                              placeholder={`Example:
Vision: Create a mobile banking app that revolutionizes personal finance management
Target Audience: Tech-savvy millennials aged 25-40
Key Goals:
- Intuitive account management
- Real-time transaction notifications
- AI-powered spending insights
- Seamless money transfers
Success Criteria:
- 100k+ downloads in first 6 months
- 4.5+ app store rating
- 60% user retention after 30 days`}
                              value={briefData || project.project_brief || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setBriefData(e.target.value)
                              }
                              className="mt-1 min-h-[300px] font-mono text-sm"
                            />
                          </div>
                          
                          <Button 
                            onClick={updateProjectBrief}
                            disabled={isUpdatingBrief || !briefData.trim()}
                            className="w-full"
                          >
                            {isUpdatingBrief ? 'Updating...' : 'Update Project Brief'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
