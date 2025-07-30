import { useCanvas } from '@/context/Context';
import { Project, ToolId } from '@/types'
import { Crop, Expand, Eye, Maximize2, Palette, Sliders, Text } from 'lucide-react';
import CropContent from './Tools/CropContent';
import ResizeControls from './Tools/ResizeControls';
import AdjustControls from './Tools/AdjustControls';
import AiBackground from './Tools/AiBackground';

type ToolConfig = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const TOOL_CONFIGS: Partial<Record<ToolId, ToolConfig>> = {
  resize: {
    title: "Resize",
    icon: Expand,
    description: "Change project dimensions",
  },
  crop: {
    title: "Crop",
    icon: Crop,
    description: "Crop and trim your image",
  },
  adjust: {
    title: "Adjust",
    icon: Sliders,
    description: "Brightness, contrast, and more (Manual saving required)",
  },
  background: {
    title: "Background",
    icon: Palette,
    description: "Remove or change background",
  },
  ai_extender: {
    title: "AI Image Extender",
    icon: Maximize2,
    description: "Extend image boundaries with AI",
  },
  text: {
    title: "Add Text",
    icon: Text,
    description: "Customize in Various Fonts",
  },
  ai_edit: {
    title: "AI Editing",
    icon: Eye,
    description: "Enhance image quality with AI",
  },
};

const EditorSideBar = ({project}: {project: Project}) => {

    const { activeTool } = useCanvas();

    const toolConfig = TOOL_CONFIGS[activeTool];

    if (!toolConfig) {
        return null;
    }

    const Icon = toolConfig.icon;

  return (
    <div className="w-96 border-r flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-white" />
          <h2 className="text-lg font-semibold text-white">
            {toolConfig.title}
          </h2>
        </div>
        <p className="text-sm text-white mt-1">{toolConfig.description}</p>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 p-4 overflow-y-auto" style={{scrollbarWidth: 'none'}}>
        {renderToolContent(activeTool, project)}
      </div>
    </div>
  )
}

function renderToolContent(activeTool: ToolId, project: Project) {
  switch (activeTool) {
    case 'resize':
      return <ResizeControls project={project} />;
    case 'crop':
      return <CropContent />;
    case 'adjust':
      return <AdjustControls project={project} />;
    case 'background':
      return <AiBackground project={project} />;
    case 'ai_extender':
      return <div>AI Extender Tool Content</div>;
    case 'text':
      return <div>Text Tool Content</div>;
    case 'ai_edit':
      return <div>AI Edit Tool Content</div>;
    default:
      return null;
  }
}

export default EditorSideBar