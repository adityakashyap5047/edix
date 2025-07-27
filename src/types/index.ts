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
  createdAt: Date;
  updatedAt: Date;

  user: User;
  projects: Project[];
}
