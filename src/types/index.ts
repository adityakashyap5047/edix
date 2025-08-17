export enum Plan {
  FREE = "FREE",
  PRO = "PRO",
}

export interface User {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  plan: Plan;
  projectsUsed: number;
  exportsThisMonth: number;
  lastWebhookId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  projects: Project[];
  folders: Folder[];
}

export interface Project {
  id: string;
  title: string;
  userId: string;
  canvasState: unknown; 
  width: number;
  height: number;
  originalImageUrl?: string | null;
  currentImageUrl?: string | null;
  thumbnailUrl?: string | null;
  activeTransformations?: string | null;
  backgroundRemoved?: boolean | null;
  folderId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  user: User;
  folder?: Folder | null;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  user: User;
  parent?: Folder | null;
  children?: Folder[];
  projects: Project[];
}

// Tool Types for Editor
export type PremiumTool = 'background' | 'ai_extender' | 'ai_edit';
export type LimitedFeature = 'projects' | 'export';
export type FreeTool = 'resize' | 'crop' | 'adjust' | 'text';
export type ToolId = PremiumTool | LimitedFeature | FreeTool;

export const TOOL_NAMES: Partial<Record<ToolId, string>> = {
  // Premium Tools
  background: "AI Background Tools",
  ai_extender: "AI Image Extender", 
  ai_edit: "AI Editor",
  
  // Limited Features
  projects: "More than 3 Projects",
  export: "Unlimited Exports",
  
  // Free Tools
  resize: "Resize Tool",
  crop: "Crop Tool", 
  adjust: "Adjust Tool",
  text: "Text Tool"
}; 