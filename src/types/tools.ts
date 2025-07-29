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
