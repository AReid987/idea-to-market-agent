
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Team, CreateTeamInput, AddTeamMemberInput, teamRoleSchema } from '../../../server/src/schema';

interface TeamManagementProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamsChange: (teams: Team[]) => void;
}

export function TeamManagement({ teams, selectedTeam, onTeamsChange }: TeamManagementProps) {
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newTeamData, setNewTeamData] = useState<CreateTeamInput>({
    name: '',
    description: null
  });
  const [newMemberData, setNewMemberData] = useState<AddTeamMemberInput>({
    team_id: 0,
    user_name: '',
    user_email: '',
    role: 'member'
  });

  const createTeam = async () => {
    setIsCreatingTeam(true);
    try {
      const team = await trpc.createTeam.mutate(newTeamData);
      onTeamsChange([...teams, team]);
      setNewTeamData({ name: '', description: null });
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const addTeamMember = async () => {
    if (!selectedTeam) return;
    
    setIsAddingMember(true);
    try {
      await trpc.addTeamMember.mutate({
        ...newMemberData,
        team_id: selectedTeam.id
      });
      setNewMemberData({
        team_id: 0,
        user_name: '',
        user_email: '',
        role: 'member'
      });
    } catch (error) {
      console.error('Failed to add team member:', error);
    } finally {
      
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setNewMemberData((prev: AddTeamMemberInput) => ({ 
      ...prev, 
      role: value as typeof teamRoleSchema._type
    }));
  };

  return (
    <div className="space-y-6">
      {/* Create Team Section */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 Team Management
          </CardTitle>
          <CardDescription>
            Create and manage your product development teams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                ➕ Create New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Set up a new team for your product development projects
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Team Name</label>
                  <Input
                    placeholder="e.g., Mobile App Team"
                    value={newTeamData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTeamData((prev: CreateTeamInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="Brief description of the team's focus and goals"
                    value={newTeamData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewTeamData((prev: CreateTeamInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={createTeam}
                  disabled={isCreatingTeam || !newTeamData.name.trim()}
                  className="w-full"
                >
                  {isCreatingTeam ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Teams List */}
      <div className="grid gap-4">
        {teams.length === 0 ? (
          <Card className="text-center py-12 bg-white/30 backdrop-blur-sm">
            <CardContent>
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
              <p className="text-gray-600">Create your first team to start building amazing products</p>
            </CardContent>
          </Card>
        ) : (
          teams.map((team: Team) => (
            <Card 
              key={team.id} 
              className={`bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow ${
                selectedTeam?.id === team.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    👥 {team.name}
                    {selectedTeam?.id === team.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    Created {team.created_at.toLocaleDateString()}
                  </div>
                </div>
                {team.description && (
                  <CardDescription>{team.description}</CardDescription>
                )}
              </CardHeader>
              
              {selectedTeam?.id === team.id && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          👤 Add Team Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                          <DialogDescription>
                            Invite a new member to join {team.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                              placeholder="John Doe"
                              value={newMemberData.user_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewMemberData((prev: AddTeamMemberInput) => ({ 
                                  ...prev, 
                                  user_name: e.target.value 
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                              type="email"
                              placeholder="john@company.com"
                              value={newMemberData.user_email}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewMemberData((prev: AddTeamMemberInput) => ({ 
                                  ...prev, 
                                  user_email: e.target.value 
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Role</label>
                            <Select 
                              value={newMemberData.role} 
                              onValueChange={handleRoleChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">👑 Owner</SelectItem>
                                <SelectItem value="admin">⚡ Admin</SelectItem>
                                <SelectItem value="member">👤 Member</SelectItem>
                                <SelectItem value="viewer">👀 Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={addTeamMember}
                            disabled={isAddingMember || !newMemberData.user_name.trim() || !newMemberData.user_email.trim()}
                            className="w-full"
                          >
                            {isAddingMember ? 'Adding...' : 'Add Member'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
