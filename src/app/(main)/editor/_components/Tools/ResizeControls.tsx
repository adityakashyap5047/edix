"use client";

import { useCanvas } from "@/context/Context";
import { useState } from "react";
import { Project } from "@/types/index"
import { Button } from "@/components/ui/button";
import { Expand, Lock, Monitor, RotateCcw, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";

const ASPECT_RATIOS = [
  { name: "Instagram Story", ratio: [9, 16], label: "9:16" },
  { name: "Instagram Post", ratio: [1, 1], label: "1:1" },
  { name: "Youtube Thumbnail", ratio: [16, 9], label: "16:9" },
  { name: "Portrait", ratio: [2, 3], label: "2:3" },
  { name: "Facebook Cover", ratio: [851, 315], label: "2.7:1" },
  { name: "Twitter Header", ratio: [3, 1], label: "3:1" },
];


const ResizeControls = ({project}: {project: Project}) => {

  const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
  
  const [newWidth, setNewWidth] = useState(project?.width || 800); 
  const [newHeight, setNewHeight] = useState(project?.height || 600); 
  const [lockAspectRatio, setLockAspectRatio] = useState(true); 
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null); 

  if (!canvasEditor || !project) {
    return (
      <div className="p-4">
        <p className="text-white/70 text-sm">Canvas not ready</p>
      </div>
    )
  }

  const hasChanges = newWidth !== project?.width || newHeight !== project?.height;

  const handleWidthChange = (value: string) => {
    const width = parseInt(value) || 0;
    if (width > 1200) {
      toast.error("Width cannot exceed 1200 pixels.");
      return;
    }
    setNewWidth(width);
    if (lockAspectRatio && project) {
      setNewHeight(Math.round((width * project.height) / project.width));
    }
    setSelectedPreset(null);
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value) || 0;
    if (height > 550) {
      toast.error("Height cannot exceed 550 pixels.");
      return;
    }
    setNewHeight(height);
    if (lockAspectRatio && project) {
      setNewWidth(Math.round((height * project.width) / project.height));
    }
    setSelectedPreset(null);
  };

  const calculateAspectRatioDimensions = (ratio: [number, number]) => {
    if (!project) return {width: 800, height: 600};

    const [ratioW, ratioH] = ratio;
    const originalArea = project.width * project.height;

    const aspectRatio = ratioW / ratioH;

    let newHeight = Math.sqrt(originalArea / aspectRatio);
    let newWidth = newHeight * aspectRatio;

    // Ensure dimensions don't exceed max limits
    const maxWidth = 1200;
    const maxHeight = 550;

    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return { width: Math.round(newWidth), height: Math.round(newHeight) };
  };

  const applyAspectRatio = (aspectRatio: { name: string; ratio: [number, number]; label: string }) => {
    const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio);
    
    // Check if dimensions were clamped due to max limits
    const [ratioW, ratioH] = aspectRatio.ratio;
    const expectedAspectRatio = ratioW / ratioH;
    const actualAspectRatio = dimensions.width / dimensions.height;
    
    if (Math.abs(expectedAspectRatio - actualAspectRatio) > 0.01) {
      toast.warning(`Dimensions adjusted to fit within limits (max: 1200×550px)`);
    }
    
    setNewWidth(dimensions.width);
    setNewHeight(dimensions.height);
    setSelectedPreset(aspectRatio.name);
  }

  const handleResizeReset = async () => {
    if (!canvasEditor || !project) {
      return;
    }

    setProcessingMessage("Resetting canvas to full area...");

    try {
      const canvasElement = canvasEditor.getElement();
      const container = canvasElement.closest('.bg-secondary');
      
      if (!container) {
        toast.error("Could not find container for reset");
        return;
      }

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const margin = 40;
      
      const availableWidth = containerWidth - margin;
      const availableHeight = containerHeight - margin;
      
      setNewWidth(availableWidth);
      setNewHeight(availableHeight);
      setSelectedPreset(null);

      canvasEditor.setWidth(availableWidth);
      canvasEditor.setHeight(availableHeight);

      const objects = canvasEditor.getObjects();
      const centerX = availableWidth / 2;
      const centerY = availableHeight / 2;
      
      objects.forEach(obj => {
        obj.set({
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center'
        });
        obj.setCoords();
      });
      
      canvasEditor.requestRenderAll();

      canvasEditor.setDimensions({
        width: availableWidth,
        height: availableHeight,
      }, { backstoreOnly: false });
      
      canvasEditor.setZoom(1);
      
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();

      let updatedTransformations = "";
      if (project.activeTransformations && project.activeTransformations.trim() !== "") {
        const existingTransformations = project.activeTransformations.trim();
        const transformationsList = existingTransformations.split('-');
        
        const filteredTransformations = transformationsList.filter(transform => transform !== "resize");
        
        updatedTransformations = filteredTransformations.join('-');
      }

      const canvasJSON = canvasEditor.toJSON();
      
      const response = await axios.post(`/api/projects/${project.id}`, {
        width: availableWidth,
        height: availableHeight,
        canvasState: canvasJSON,
        activeTransformations: updatedTransformations || null
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200) {
        project.width = availableWidth;
        project.height = availableHeight;
        
        toast.success(`Canvas Reset to Full Area - Auto Saved!`);
      } else {
        toast.error("Failed to Auto Saved. Please save manually.");
      }

    } catch (error) {
      console.error("Error resetting canvas:", error);
      toast.error("Failed to reset canvas. Please try again.");
      
    } finally {
      setProcessingMessage(null);
    }
  }

  const handleApplyResize = async () => {
    if (
      !canvasEditor ||
      !project ||
      (newWidth === project.width && newHeight === project.height)
    ) {
      return;
    }

    // Validate dimensions before applying
    if (newWidth > 1200) {
      toast.error("Width cannot exceed 1200 pixels.");
      return;
    }

    if (newHeight > 550) {
      toast.error("Height cannot exceed 550 pixels.");
      return;
    }

    setProcessingMessage("Resizing canvas...");

    try {
      project.width = newWidth;
      project.height = newHeight;
      
      canvasEditor.setWidth(newWidth);
      canvasEditor.setHeight(newHeight);

      // Center all objects BEFORE applying zoom and scaling
      const objects = canvasEditor.getObjects();
      const centerX = newWidth / 2;
      const centerY = newHeight / 2;
      
      objects.forEach(obj => {
        // Set object to exact center of new canvas dimensions
        obj.set({
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center'
        });
        obj.setCoords();
      });
      
      // Force a render to apply centering
      canvasEditor.requestRenderAll();

      const canvasElement = canvasEditor.getElement();
      const container = canvasElement.closest('.bg-secondary');
      
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const margin = 40;
        const scale = newWidth > newHeight
          ? (containerWidth - margin) / newWidth
          : (containerHeight - margin) / newHeight;

        const scaledWidth = newWidth * scale;
        const scaledHeight = newHeight * scale;

        canvasEditor.setDimensions({
          width: scaledWidth,
          height: scaledHeight,
        }, { backstoreOnly: false });
        
        canvasEditor.setZoom(scale);
        
        // Recalculate offset and render
        canvasEditor.calcOffset();
        canvasEditor.requestRenderAll();
      }

      const canvasJSON = canvasEditor.toJSON();
      
      let updatedTransformations = "resize";
      if (project.activeTransformations && project.activeTransformations.trim() !== "") {
        const existingTransformations = project.activeTransformations.trim();
        const transformationsList = existingTransformations.split('-');
        
        if (!transformationsList.includes("resize")) {
          updatedTransformations = `${existingTransformations}-resize`;
        } else {
          updatedTransformations = existingTransformations;
        }
      }
      
      const response = await axios.post(`/api/projects/${project.id}`, {
        width: newWidth,
        height: newHeight,
        canvasState: canvasJSON,
        activeTransformations: updatedTransformations
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200) {
        toast.success(`Canvas is Auto Saved!`);
      } else {
        toast.error("Canvas resized but failed to auto-save. Please save manually.");
      }

    } catch (error) {
      console.error("Error resizing canvas:", error);
      toast.error("Failed to resize canvas. Please try again.");
      
    } finally {
      setProcessingMessage(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between bg-slate-700/30 rounded-lg p-3">
        <div>
          <h4 className="text-sm font-medium text-white mb-2">Current Size</h4>
          <div className="text-xs text-white/70">
            {project.width} x {project.height} pixels
          </div>
        </div>
        <Button variant={"ghost"} size={"sm"} onClick={handleResizeReset}  className='text-white/70 hover:text-white'>
            <RotateCcw className='h-4 w-4 mr-2' />
            Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Custom Size</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLockAspectRatio(!lockAspectRatio)}
            className="text-white/70 hover:text-white p-1"
          >
            {lockAspectRatio ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/70 mb-1 block">Width</label>
            <Input
              type="number"
              value={newWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              min={"100"}
              max={"1200"}
              className="bg-slate-700 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Height</label>
            <Input
              type="number"
              value={newHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              min={"100"}
              max={"550"}
              className="bg-slate-700 border-white/20 text-white"
            />
          </div>
        </div>
        <div className="text-xs">
          <span className="text-white/70">
            {lockAspectRatio ? "Aspect ratio locked" : "Free to resize"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white">Aspect Ratios</h3>
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto px-4">
          {ASPECT_RATIOS.map((aspectRatio) => {
            const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio as [number, number]);
            return (
              <Button
                key={aspectRatio.name}
                variant={
                  selectedPreset === aspectRatio.name ? "default" : "outline"
                }
                size={"sm"}
                onClick={() => applyAspectRatio(aspectRatio as { name: string; ratio: [number, number]; label: string })}
                className={`justify-between h-auto py-2 ${
                  selectedPreset === aspectRatio.name
                    ? "bg-cyan-500 hover:bg-cyan-600"
                    : "text-left"
                }`}
              >
                <div>
                  <div className="font-medium">{aspectRatio.name}</div>
                  <div className="text-xs opacity-70">
                    {dimensions.width} x {dimensions.height} (
                    {aspectRatio.label})
                  </div>
                </div>
                <Monitor className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </div>

      {hasChanges && (
        <div className="bg-slate-700/30 rounded-lg p-3">
          <h4 className="text-sm font-medium text-white mb-2">
            New Size Preview
          </h4>
          <div className="text-xs text-white/70">
            <div>
              New Canvas: {newWidth} × {newHeight} pixels
            </div>
            <div className="text-cyan-400">
              {newWidth > project.width || newHeight > project.height
                ? "Canvas will be expanded"
                : "Canvas will be cropped"}
            </div>
            <div className="text-white/50 mt-1">
              Objects will maintain their current size and position
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleApplyResize}
        disabled={!hasChanges || !!processingMessage}
        className="w-full hover:!scale-101"
        variant="primary"
      >
        <Expand className="h-4 w-4 mr-2" />
        Apply Resize
      </Button>

      <div className="bg-slate-700/30 rounded-lg p-3">
        <p className="text-xs text-white/70">
          <strong>Resize Canvas:</strong> Changes canvas dimensions.
          <br />
          <strong>Aspect Ratios:</strong> Smart sizing based on your current
          canvas.
          <br />
          Objects maintain their size and position.
        </p>
      </div>
    </div>
  )
}

export default ResizeControls