
import { db } from '../db';
import { artifactsTable, projectsTable } from '../db/schema';
import { type GenerateArtifactInput, type Artifact } from '../schema';
import { eq } from 'drizzle-orm';

export const generateArtifact = async (input: GenerateArtifactInput): Promise<Artifact> => {
  try {
    // First verify the project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with ID ${input.project_id} not found`);
    }

    // Generate a title based on the artifact type
    const title = generateTitleForType(input.type);
    
    // Generate content based on the artifact type and project brief
    const content = generateContentForType(input.type, project[0].project_brief);

    // Insert artifact record
    const result = await db.insert(artifactsTable)
      .values({
        project_id: input.project_id,
        type: input.type,
        title,
        content,
        status: 'draft',
        canvas_position_x: input.canvas_position_x ?? 0,
        canvas_position_y: input.canvas_position_y ?? 0,
        canvas_width: 400,
        canvas_height: 300,
        dependencies: null,
        metadata: null
      })
      .returning()
      .execute();

    // Convert the database result to match our schema types
    const artifact = result[0];
    return {
      ...artifact,
      dependencies: artifact.dependencies as number[] | null,
      metadata: artifact.metadata as Record<string, unknown> | null
    };
  } catch (error) {
    console.error('Artifact generation failed:', error);
    throw error;
  }
};

function generateTitleForType(type: string): string {
  const titleMap: Record<string, string> = {
    'project_brief': 'Project Brief',
    'prd': 'Product Requirements Document',
    'kanban_board': 'Kanban Board',
    'lean_canvas': 'Lean Canvas',
    'design_architecture': 'Design Architecture',
    'system_architecture': 'System Architecture',
    'ui_ux_spec': 'UI/UX Specification',
    'user_flows': 'User Flows',
    'design_system': 'Design System'
  };
  
  return titleMap[type] || 'Untitled Artifact';
}

function generateContentForType(type: string, projectBrief: string | null): string {
  const briefContext = projectBrief ? `Based on the project brief: "${projectBrief}"` : 'No project brief available.';
  
  const contentTemplates: Record<string, string> = {
    'project_brief': `# Project Brief\n\n${briefContext}\n\n## Overview\nThis section outlines the key objectives and scope of the project.\n\n## Goals\n- Define primary objectives\n- Establish success criteria\n- Identify key stakeholders`,
    
    'prd': `# Product Requirements Document\n\n${briefContext}\n\n## Product Overview\nDetailed description of the product requirements and specifications.\n\n## Features\n- Core functionality requirements\n- User acceptance criteria\n- Technical specifications`,
    
    'kanban_board': `# Kanban Board\n\n${briefContext}\n\n## Workflow Stages\n- **To Do**: Tasks ready to be started\n- **In Progress**: Currently active tasks\n- **Review**: Tasks awaiting review\n- **Done**: Completed tasks\n\n## Initial Tasks\n- Set up project structure\n- Define requirements\n- Create development plan`,
    
    'lean_canvas': `# Lean Canvas\n\n${briefContext}\n\n## Business Model Canvas\n- **Problem**: Key problems to solve\n- **Solution**: Proposed solutions\n- **Value Proposition**: Unique value offered\n- **Customer Segments**: Target audience\n- **Revenue Streams**: How to generate revenue`,
    
    'design_architecture': `# Design Architecture\n\n${briefContext}\n\n## Design System\n- Component hierarchy\n- Design patterns\n- Visual guidelines\n- Interaction principles\n\n## Architecture Overview\n- Information architecture\n- User interface structure\n- Design component relationships`,
    
    'system_architecture': `# System Architecture\n\n${briefContext}\n\n## Technical Architecture\n- System components\n- Data flow diagrams\n- Technology stack\n- Infrastructure requirements\n\n## Integration Points\n- API specifications\n- Database design\n- Third-party services`,
    
    'ui_ux_spec': `# UI/UX Specification\n\n${briefContext}\n\n## User Experience Design\n- User personas\n- User journey mapping\n- Wireframes and mockups\n- Interaction specifications\n\n## Design Guidelines\n- Color palette\n- Typography\n- Spacing and layout\n- Accessibility requirements`,
    
    'user_flows': `# User Flows\n\n${briefContext}\n\n## Primary User Flows\n- User registration/login flow\n- Core feature usage flows\n- Error handling flows\n- Exit points and alternatives\n\n## Flow Documentation\n- Step-by-step user actions\n- Decision points\n- Success and failure paths`,
    
    'design_system': `# Design System\n\n${briefContext}\n\n## Component Library\n- Base components (buttons, inputs, etc.)\n- Composite components\n- Layout components\n- Navigation components\n\n## Design Tokens\n- Colors\n- Typography scales\n- Spacing system\n- Border radius and shadows`
  };
  
  return contentTemplates[type] || `# ${type}\n\n${briefContext}\n\nContent for this artifact type needs to be developed.`;
}
