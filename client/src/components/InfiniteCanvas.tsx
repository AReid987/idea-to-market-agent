
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { Project, Artifact, GenerateArtifactInput, UpdateArtifactInput, artifactTypeSchema, artifactStatusSchema } from '../../../server/src/schema';

interface InfiniteCanvasProps {
  project: Project;
  artifacts: Artifact[];
  onArtifactsChange: (artifacts: Artifact[]) => void;
}

interface CanvasPosition {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  dragType: 'canvas' | 'artifact';
  startPos: CanvasPosition;
  artifactId?: number;
}

export function InfiniteCanvas({ project, artifacts, onArtifactsChange }: InfiniteCanvasProps) {
  const [canvasOffset, setCanvasOffset] = useState<CanvasPosition>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'canvas',
    startPos: { x: 0, y: 0 }
  });
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const artifactTypes = [
    { value: 'project_brief', label: '📋 Project Brief', description: 'High-level project overview' },
    { value: 'prd', label: '📊 PRD', description: 'Product Requirements Document' },
    { value: 'kanban_board', label: '📌 Kanban Board', description: 'Task management board' },
    { value: 'lean_canvas', label: '🎯 Lean Canvas', description: 'Business model canvas' },
    { value: 'design_architecture', label: '🏗️ Design Architecture', description: 'Design system architecture' },
    { value: 'system_architecture', label: '⚙️ System Architecture', description: 'Technical system design' },
    { value: 'ui_ux_spec', label: '🎨 UI/UX Spec', description: 'User interface specifications' },
    { value: 'user_flows', label: '🔄 User Flows', description: 'User journey mappings' },
    { value: 'design_system', label: '🎭 Design System', description: 'Component design system' }
  ];

  const handleMouseDown = useCallback((e: React.MouseEvent, artifactId?: number) => {
    if (artifactId) {
      setDragState({
        isDragging: true,
        dragType: 'artifact',
        startPos: { x: e.clientX, y: e.clientY },
        artifactId
      });
    } else {
      setDragState({
        isDragging: true,
        dragType: 'canvas',
        startPos: { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y }
      });
    }
  }, [canvasOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    if (dragState.dragType === 'canvas') {
      setCanvasOffset({
        x: e.clientX - dragState.startPos.x,
        y: e.clientY - dragState.startPos.y
      });
    } else if (dragState.dragType === 'artifact' && dragState.artifactId) {
      const deltaX = e.clientX - dragState.startPos.x;
      const deltaY = e.clientY - dragState.startPos.y;
      
      const updatedArtifacts = artifacts.map((artifact: Artifact) => {
        if (artifact.id === dragState.artifactId) {
          return {
            ...artifact,
            canvas_position_x: artifact.canvas_position_x + deltaX,
            canvas_position_y: artifact.canvas_position_y + deltaY
          };
        }
        return artifact;
      });
      
      onArtifactsChange(updatedArtifacts);
      setDragState(prev => ({ ...prev, startPos: { x: e.clientX, y: e.clientY } }));
    }
  }, [dragState, artifacts, onArtifactsChange]);

  const handleMouseUp = useCallback(async () => {
    if (dragState.isDragging && dragState.dragType === 'artifact' && dragState.artifactId) {
      const artifact = artifacts.find((a: Artifact) => a.id === dragState.artifactId);
      if (artifact) {
        try {
          await trpc.updateArtifact.mutate({
            id: artifact.id,
            canvas_position_x: artifact.canvas_position_x,
            canvas_position_y: artifact.canvas_position_y
          });
        } catch (error) {
          console.error('Failed to update artifact position:', error);
        }
      }
    }
    setDragState({ isDragging: false, dragType: 'canvas', startPos: { x: 0, y: 0 } });
  }, [dragState, artifacts]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.25, Math.min(2, zoom + (e.deltaY > 0 ? -0.1 : 0.1)));
    setZoom(newZoom);
  }, [zoom]);

  const generateArtifact = async (type: string) => {
    setIsGenerating(true);
    try {
      const input: GenerateArtifactInput = {
        project_id: project.id,
        type: type as typeof artifactTypeSchema._type,
        canvas_position_x: Math.random() * 400,
        canvas_position_y: Math.random() * 400
      };
      
      const newArtifact = await trpc.generateArtifact.mutate(input);
      onArtifactsChange([...artifacts, newArtifact]);
    } catch (error) {
      console.error('Failed to generate artifact:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateArtifact = async (updates: UpdateArtifactInput) => {
    try {
      const updatedArtifact = await trpc.updateArtifact.mutate(updates);
      const updatedArtifacts = artifacts.map((artifact: Artifact) =>
        artifact.id === updates.id ? { ...artifact, ...updatedArtifact } : artifact
      );
      onArtifactsChange(updatedArtifacts);
      setEditingArtifact(null);
    } catch (error) {
      console.error('Failed to update artifact:', error);
    }
  };

  return (
    <div className="relative w-full h-[800px] bg-gray-50 rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <Select onValueChange={generateArtifact}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Generate Artifact" />
          </SelectTrigger>
          <SelectContent>
            {artifactTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCanvasOffset({ x: 0, y: 0 });
            setZoom(1);
          }}
        >
          Reset View
        </Button>
        
        <div className="text-sm text-gray-600 bg-white/50 px-2 py-1 rounded">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="absolute top-4 right-4 z-20 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          🤖 AI Agent generating artifact...
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={(e: React.MouseEvent) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
        }}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Artifacts */}
        {artifacts.map((artifact: Artifact) => (
          <Card
            key={artifact.id}
            className="absolute cursor-move hover:shadow-xl transition-all duration-200 bg-white/95 backdrop-blur-sm border-2 hover:border-blue-400"
            style={{
              left: `${artifact.canvas_position_x}px`,
              top: `${artifact.canvas_position_y}px`,
              width: `${artifact.canvas_width}px`,
              height: `${artifact.canvas_height}px`,
              minWidth: '250px',
              minHeight: '150px'
            }}
            onMouseDown={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleMouseDown(e, artifact.id);
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedArtifact(artifact);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getArtifactIcon(artifact.type)}
                  <span className="truncate">{artifact.title}</span>
                </CardTitle>
                <Badge variant={getStatusVariant(artifact.status)} className="text-xs">
                  {artifact.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-600 line-clamp-4">
                {artifact.content.substring(0, 150)}...
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Artifact Detail Dialog */}
      <Dialog open={!!selectedArtifact} onOpenChange={() => setSelectedArtifact(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedArtifact && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getArtifactIcon(selectedArtifact.type)}
                  {selectedArtifact.title}
                </DialogTitle>
                <DialogDescription>
                  {formatArtifactType(selectedArtifact.type)} • 
                  Last updated {selectedArtifact.updated_at.toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusVariant(selectedArtifact.status)}>
                    {selectedArtifact.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingArtifact(selectedArtifact)}
                  >
                    ✏️ Edit
                  </Button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{selectedArtifact.content}</pre>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Artifact Dialog */}
      <Dialog open={!!editingArtifact} onOpenChange={() => setEditingArtifact(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {editingArtifact && (
            <EditArtifactForm
              artifact={editingArtifact}
              onSave={updateArtifact}
              onCancel={() => setEditingArtifact(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditArtifactFormProps {
  artifact: Artifact;
  onSave: (updates: UpdateArtifactInput) => void;
  onCancel: () => void;
}

function EditArtifactForm({ artifact, onSave, onCancel }: EditArtifactFormProps) {
  const [title, setTitle] = useState(artifact.title);
  const [content, setContent] = useState(artifact.content);
  const [status, setStatus] = useState<typeof artifactStatusSchema._type>(artifact.status);

  const handleSave = () => {
    onSave({
      id: artifact.id,
      title,
      content,
      status
    });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as typeof artifactStatusSchema._type);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Artifact</DialogTitle>
        <DialogDescription>
          Modify the content and properties of your artifact
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Content</label>
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            className="mt-1 min-h-[300px] font-mono text-sm"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </>
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
