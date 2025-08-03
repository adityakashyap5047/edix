"use client";

import { useCanvas } from "@/context/Context";
import { Project } from "@/types"
import { Camera, CheckCircle, Mountain, Sparkles, User } from "lucide-react";
import { useState } from "react";

const RETOUCH_PRESETS = [
  {
    key: "ai_retouch",
    label: "AI Retouch",
    description: "Improve image quality with AI",
    icon: Sparkles,
    transform: "e-retouch",
    recommended: true,
  },
  {
    key: "ai_upscale",
    label: "AI Upscale",
    description: "Increase resolution to 16MP",
    icon: User,
    transform: "e-upscale",
    recommended: false,
  },
  {
    key: "enhance_sharpen",
    label: "Enhance & Sharpen",
    description: "AI retouch + contrast + sharpening",
    icon: Mountain,
    transform: "e-retouch,e-contrast,e-sharpen",
    recommended: false,
  },
  {
    key: "premium_quality",
    label: "Premium Quality",
    description: "AI retouch + upscale + enhancements",
    icon: Camera,
    transform: "e-retouch,e-upscale,e-contrast,e-sharpen",
    recommended: false,
  },
];

const AiEdit = ( {project}: {project: Project} ) => {

    const { canvasEditor, setProcessingMessage } = useCanvas();
    const [selectedPreset, setSelectedPreset] = useState("ai_retouch");

    const getMainImage = () => canvasEditor?.getObjects().find((obj) => obj.type === "image") || null;
    const hasActiveTransformations = project.activeTransformations?.includes("e-retouch");
    const selectedPresetData = RETOUCH_PRESETS.find((p) => p.key === selectedPreset);

   return (
        <div className="space-y-6">
            {hasActiveTransformations && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                    <h3 className="text-green-400 font-medium mb-1">
                        Image Enhanced
                    </h3>
                    <p className="text-green-300/80 text-sm">
                        AI enhancements have been applied to this image
                    </p>
                    </div>
                </div>
                </div>
            )}
            
        </div>
   )
}

export default AiEdit