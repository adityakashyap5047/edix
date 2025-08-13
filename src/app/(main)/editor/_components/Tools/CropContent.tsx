"use client";

import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/Context";
import { Project } from "@/types";
import axios from "axios";
import { FabricImage, Rect, FabricObject } from "fabric";
import { CheckCheck, RectangleHorizontal, RectangleVertical, RotateCcw, Smartphone, Square, X, MoveDown, MoveUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

interface OriginalProps {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  selectable: boolean;
  evented: boolean;
}

const ASPECT_RATIOS = [
  { label: "Square", value: 1, icon: Square, ratio: "1:1" },
  {
    label: "Widescreen",
    value: 16 / 9,
    icon: RectangleHorizontal,
    ratio: "16:9",
  },
  { label: "Portrait", value: 4 / 5, icon: RectangleVertical, ratio: "4:5" },
  { label: "Story", value: 9 / 16, icon: Smartphone, ratio: "9:16" },
];

const CropContent = ({project}: {project: Project}) => {

  const{ canvasEditor, activeTool, setProcessingMessage } = useCanvas();

  const [selectedImage, setSelectedImage] = useState<FabricObject | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [originalProps, setOriginalProps] = useState<OriginalProps | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const maintainLayerOrder = useCallback((newImage: FabricObject, originalIndex: number) => {
    if (!canvasEditor) return;
    
    // Get all objects that were above the original image
    const allObjects = canvasEditor.getObjects();
    const objectsAbove: FabricObject[] = [];
    
    // Find objects that should remain above the image (especially text)
    for (let i = originalIndex + 1; i < allObjects.length; i++) {
      const obj = allObjects[i];
      if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
        objectsAbove.push(obj);
      }
    }
    
    // If there are objects that should be above, bring them to front
    if (objectsAbove.length > 0) {
      objectsAbove.forEach(obj => {
        canvasEditor.bringObjectToFront(obj);
      });
      canvasEditor.requestRenderAll();
    }
  }, [canvasEditor]);

  const sendImageBehindText = useCallback(() => {
    if (!canvasEditor) return;
    
    const activeObject = canvasEditor.getActiveObject();
    if (activeObject && activeObject.type === 'image') {
      // Get all text objects
      const allObjects = canvasEditor.getObjects();
      const textObjects = allObjects.filter(obj => 
        obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox'
      );
      
      if (textObjects.length > 0) {
        // Send image to back
        canvasEditor.sendObjectToBack(activeObject);
        
        // Then bring text objects forward
        textObjects.forEach(textObj => {
          canvasEditor.bringObjectToFront(textObj);
        });
        
        canvasEditor.requestRenderAll();
        toast.success("Image moved behind text");
      }
    }
  }, [canvasEditor]);

  const bringImageInFrontOfText = useCallback(() => {
    if (!canvasEditor) return;
    
    const activeObject = canvasEditor.getActiveObject();
    if (activeObject && activeObject.type === 'image') {
      canvasEditor.bringObjectToFront(activeObject);
      canvasEditor.requestRenderAll();
      toast.success("Image moved in front of text");
    }
  }, [canvasEditor]);

  const getActiveImage = useCallback(() => {
    if (!canvasEditor) return null;

    const activeObject = canvasEditor.getActiveObject();
    if (activeObject && activeObject.type === "image") {
      return activeObject;
    }

    const objects = canvasEditor.getObjects();
    return objects.find((obj) => obj.type === "image") || null;
  }, [canvasEditor]);

  const removeAllCropRectangles = useCallback(() => {
    if (!canvasEditor) return;

    // If we have a reference to the current crop rectangle, remove it directly
    if (cropRect) {
      canvasEditor.remove(cropRect);
      canvasEditor.requestRenderAll();
      return;
    }

    // Fallback: remove all rectangles (less precise but works)
    const objects = canvasEditor.getObjects();
    const rectsToRemove = objects.filter(obj => obj.type === "rect");

    rectsToRemove.forEach(rect => {
      canvasEditor.remove(rect);
    });

    if (rectsToRemove.length > 0) {
      canvasEditor.requestRenderAll();
    }
  }, [canvasEditor, cropRect]);

  const exitCropMode = useCallback(() => {
    if(!isCropMode || !canvasEditor) return;

    // Remove all crop rectangles
    removeAllCropRectangles();
    
    // Clear crop rectangle reference
    setCropRect(null);

    // Restore original image properties
    if (selectedImage && originalProps) {
      selectedImage.set({
          selectable: originalProps.selectable,
          evented: originalProps.evented,
          // Restore other properties if needed
          left: originalProps.left,
          top: originalProps.top,
          scaleX: originalProps.scaleX,
          scaleY: originalProps.scaleY,
          angle: originalProps.angle,
      });

      // Select the restored image
      canvasEditor.setActiveObject(selectedImage);
    }

    // Clear all state
    setIsCropMode(false);
    setSelectedImage(null);
    setOriginalProps(null);
    setSelectedRatio(null);

    // Force canvas re-render
    canvasEditor.requestRenderAll();
  }, [isCropMode, canvasEditor, selectedImage, originalProps, removeAllCropRectangles]);

  const extractJsonData = (str: string, operationName: string) => {
    if (!str || typeof str !== "string") return null;
    const pattern = `${operationName}[`;
    const startIndex = str.indexOf(pattern);
    if (startIndex === -1) return null;

    let bracketCount = 0;
    const jsonStart = startIndex + pattern.length;
    let i = jsonStart;

    for (; i < str.length; i++) {
      if (str[i] === "[") bracketCount++;
      else if (str[i] === "]") {
        if (bracketCount === 0) break;
        bracketCount--;
      }
    }

    const jsonString = str.slice(jsonStart, i);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error(`Invalid JSON for ${operationName}:`, e);
      return null;
    }
  }

  useEffect(() => {
    if (activeTool === "crop" && canvasEditor) { 
      setLoading(true);
      const canvasState = canvasEditor.toJSON();
      const getProjectData = async () => {
        try {
          const response = await axios.get(`/api/projects/${project.id}`);
          let activeTransformations = response.data.activeTransformations;
          const canvasJson = extractJsonData(activeTransformations, "crop");
          if (canvasJson) {
            activeTransformations = activeTransformations.replace(`crop[${JSON.stringify(canvasJson)}]`, `crop[${JSON.stringify(canvasState)}]`);
          } else {
            activeTransformations = activeTransformations ? activeTransformations + `-crop[${JSON.stringify(canvasState)}]` : `crop[${JSON.stringify(canvasState)}]`;
          }
          await axios.post(`/api/projects/${project.id}`, {
            activeTransformations,
          });
        } catch (error) {
          console.error("Error fetching project data:", error);
        } finally {
          setLoading(false);
        }
      };
      getProjectData();
    }
  }, [activeTool, canvasEditor, project]);

  useEffect(() => {
    return () => {
      if (isCropMode) {
        exitCropMode();
      }
    }
  }, [isCropMode, exitCropMode])

  const createCropRectangle = useCallback((image: FabricObject) => {
    const bounds = image.getBoundingRect();

    // Create crop rectangle slightly smaller than the image
    const margin = Math.min(bounds.width, bounds.height) * 0.1;
    const cropWidth = bounds.width - (margin * 2);
    const cropHeight = bounds.height - (margin * 2);

    const cropRectangle  = new Rect({
      left: bounds.left + margin,
      top: bounds.top + margin,
      width: cropWidth,
      height: cropHeight,
      fill: "transparent",
      stroke: "#00bcd4",
      strokeWidth: 3,
      strokeDashArray: [8, 4],
      selectable: true,
      evented: true,
      name: "cropRect",
      opacity: 1,

      // VISUAL STYLING FOR CROP HANDLES
      cornerColor: "#00bcd4",
      cornerSize: 14,
      transparentCorners: false,
      cornerStyle: "circle",
      borderColor: "#00bcd4",
      borderScaleFactor: 1.5,
      padding: 0,

      // Custom Property to identify crop rectangles
      isCropRectangle: true,
    });

    // Constrain crop rectangle to stay within image bounds
    cropRectangle.on("moving", (e) => {
      const movingRect = e.transform?.target as Rect;
      if (!movingRect) return;
      
      const rectBounds = movingRect.getBoundingRect();
      
      // Keep crop rectangle within image bounds
      if (rectBounds.left < bounds.left) {
        movingRect.set({ left: bounds.left });
      }
      if (rectBounds.top < bounds.top) {
        movingRect.set({ top: bounds.top });
      }
      if (rectBounds.left + rectBounds.width > bounds.left + bounds.width) {
        movingRect.set({ left: bounds.left + bounds.width - rectBounds.width });
      }
      if (rectBounds.top + rectBounds.height > bounds.top + bounds.height) {
        movingRect.set({ top: bounds.top + bounds.height - rectBounds.height });
      }
    });

    cropRectangle.on("scaling", (e) => {
      const scalingRect = e.transform?.target as Rect;
      if (!scalingRect) return;

      if(selectedRatio && selectedRatio !== null) {
        // Get current dimensions including scale
        const currentWidth = scalingRect.width * scalingRect.scaleX;
        const currentHeight = scalingRect.height * scalingRect.scaleY;
        const currentRatio = currentWidth / currentHeight;
        
        // If the ratio doesn't match the selected ratio, adjust
        if (Math.abs(currentRatio - selectedRatio) > 0.01) {
          // Calculate new height based on current width and desired ratio
          const newHeight = currentWidth / selectedRatio;
          
          // Update the rectangle dimensions
          scalingRect.set({
            height: newHeight / scalingRect.scaleY,
            scaleY: scalingRect.scaleX
          });
        }
      }

      // Ensure crop rectangle doesn't exceed image bounds
      const rectBounds = scalingRect.getBoundingRect();
      
      // Check if crop rectangle is going outside image bounds and constrain it
      if (rectBounds.left < bounds.left || 
          rectBounds.top < bounds.top ||
          rectBounds.left + rectBounds.width > bounds.left + bounds.width ||
          rectBounds.top + rectBounds.height > bounds.top + bounds.height) {
        
        // Calculate maximum scale that keeps rectangle within bounds
        const maxScaleX = (bounds.width - (scalingRect.left - bounds.left)) / scalingRect.width;
        const maxScaleY = (bounds.height - (scalingRect.top - bounds.top)) / scalingRect.height;
        const maxScale = Math.min(maxScaleX, maxScaleY, scalingRect.scaleX, scalingRect.scaleY);
        
        scalingRect.set({
          scaleX: Math.max(0.1, maxScale),
          scaleY: Math.max(0.1, maxScale)
        });
      }

      canvasEditor?.requestRenderAll();
    });

    canvasEditor?.add(cropRectangle);
    canvasEditor?.setActiveObject(cropRectangle);
    setCropRect(cropRectangle);
  }, [canvasEditor, selectedRatio]);

  const initializeCropMode = useCallback((image: FabricObject) => {
    if (!canvasEditor || !image || isCropMode) return;

    removeAllCropRectangles();

    const original: OriginalProps = {
      left: image.left || 0,
      top: image.top || 0,
      width: image.width || 0,
      height: image.height || 0,
      scaleX: image.scaleX || 1,
      scaleY: image.scaleY || 1,
      angle: image.angle || 0,
      selectable: image.selectable ?? true,
      evented: image.evented ?? true,
    }

    setOriginalProps(original);
    setSelectedImage(image);
    setIsCropMode(true);

    image.set({
      selectable: false,
      evented: false,
    })

    createCropRectangle(image);
    canvasEditor.requestRenderAll();
  }, [canvasEditor, isCropMode, removeAllCropRectangles, createCropRectangle]);

  const handleAspectRatioClick = (ratio: number) => {
    if (!isCropMode) {
      // If not in crop mode, first initialize crop mode
      const image = getActiveImage();
      if (image) {
        initializeCropMode(image);
        // Set the ratio after a short delay to ensure crop rectangle is created
        setTimeout(() => {
          applyAspectRatio(ratio);
        }, 100);
      }
    } else {
      // If already in crop mode, just apply the aspect ratio
      applyAspectRatio(ratio);
    }
  };

  const applyAspectRatio = (ratio: number | null) => {
    setSelectedRatio(ratio);

    if (!cropRect || !canvasEditor || ratio === null) return;

    // Get current dimensions with scale
    const currentWidth = cropRect.width * cropRect.scaleX;
    const newHeight = currentWidth / ratio;

    // Calculate the center point before changing dimensions
    const centerX = cropRect.left + (cropRect.width * cropRect.scaleX) / 2;
    const centerY = cropRect.top + (cropRect.height * cropRect.scaleY) / 2;

    // Temporarily deselect to clear old controls
    canvasEditor.discardActiveObject();
    canvasEditor.requestRenderAll();

    // Update the rectangle with new dimensions
    cropRect.set({
      height: newHeight / cropRect.scaleY,
      scaleY: cropRect.scaleX,
      // Reposition to maintain center
      left: centerX - (cropRect.width * cropRect.scaleX) / 2,
      top: centerY - newHeight / 2,
    });

    // Update coordinates and reselect to show new controls
    cropRect.setCoords(); 
    canvasEditor.setActiveObject(cropRect);
    canvasEditor.requestRenderAll();
    
    // Force a second render to ensure everything is cleaned up
    setTimeout(() => {
      canvasEditor.requestRenderAll();
    }, 10);
  };

  const applyCrop = () => {
    if(!selectedImage || !cropRect || !canvasEditor) return;

    try {
      const cropBounds = cropRect.getBoundingRect();
      
      // Store the original image's layer index BEFORE removing it
      const originalImageIndex = canvasEditor.getObjects().indexOf(selectedImage);
      
      // Get the image's actual position and dimensions
      const imageLeft = selectedImage.left || 0;
      const imageTop = selectedImage.top || 0;
      const imageWidth = (selectedImage.width || 0) * (selectedImage.scaleX || 1);
      const imageHeight = (selectedImage.height || 0) * (selectedImage.scaleY || 1);
      
      // Calculate the actual image bounds
      const actualImageLeft = imageLeft - (imageWidth / 2);
      const actualImageTop = imageTop - (imageHeight / 2);

      // Calculate relative crop coordinates within the image
      const relativeLeft = (cropBounds.left - actualImageLeft) / imageWidth;
      const relativeTop = (cropBounds.top - actualImageTop) / imageHeight;
      const relativeWidth = cropBounds.width / imageWidth;
      const relativeHeight = cropBounds.height / imageHeight;

      // Clamp values to ensure they're within image bounds
      const clampedLeft = Math.max(0, Math.min(1, relativeLeft));
      const clampedTop = Math.max(0, Math.min(1, relativeTop));
      const clampedWidth = Math.max(0, Math.min(1 - clampedLeft, relativeWidth));
      const clampedHeight = Math.max(0, Math.min(1 - clampedTop, relativeHeight));

      // Get the original image dimensions (without scaling)
      const originalImageWidth = selectedImage.width || 0;
      const originalImageHeight = selectedImage.height || 0;

      // Calculate actual crop coordinates in the original image
      const cropX = clampedLeft * originalImageWidth;
      const cropY = clampedTop * originalImageHeight;
      const cropWidth = clampedWidth * originalImageWidth;
      const cropHeight = clampedHeight * originalImageHeight;

      // Get the image element from the selected image
      const fabricImageObject = selectedImage as FabricImage;
      const imageElement = fabricImageObject.getElement();

      // Store the crop position for the new image
      const newImageLeft = cropBounds.left + cropBounds.width / 2;
      const newImageTop = cropBounds.top + cropBounds.height / 2;

      // Clear all state FIRST to prevent conflicts
      setIsCropMode(false);
      setSelectedImage(null);
      setOriginalProps(null);
      setSelectedRatio(null);
      setCropRect(null);

      // Remove the original image and crop rectangle BEFORE adding new image
      canvasEditor.remove(selectedImage);
      canvasEditor.remove(cropRect);
      
      // Clear selection to avoid conflicts
      canvasEditor.discardActiveObject();

      const croppedImage = new FabricImage(imageElement, {
        left: newImageLeft,
        top: newImageTop,
        originX: "center",
        originY: "center",
        selectable: true,
        evented: true,
        // Apply Crop using Fabric.js crop properties
        cropX: cropX,
        cropY: cropY,
        cropWidth: cropWidth,
        cropHeight: cropHeight,
        // Set the display size to match the crop rectangle
        width: cropWidth,
        height: cropHeight,
        scaleX: cropBounds.width / cropWidth,
        scaleY: cropBounds.height / cropHeight,
      })

      // Insert the cropped image at the same layer position as the original image
      if (originalImageIndex >= 0) {
        canvasEditor.insertAt(originalImageIndex, croppedImage);
        // Maintain proper layer order for text elements
        maintainLayerOrder(croppedImage, originalImageIndex);
      } else {
        canvasEditor.add(croppedImage);
      }
      
      canvasEditor.setActiveObject(croppedImage);
      canvasEditor.requestRenderAll();

      toast.success("Crop applied successfully!");
    } catch (error) {
      console.error("Error applying crop:", error);
      toast.error("Failed to apply crop");
      // If there's an error, make sure to properly exit crop mode
      setIsCropMode(false);
      setSelectedImage(null);
      setOriginalProps(null);
      setSelectedRatio(null);
      setCropRect(null);
    }
  };

  const handleCropReset = async () => {
    if (!canvasEditor) return;
    
    try {
      setProcessingMessage("Resetting the crop...");
      const response = await axios.get(`/api/projects/${project.id}`);
      const { activeTransformations } = response.data;
      const hasCropTransformations = activeTransformations && activeTransformations.split("-").some((item: string) => item.toLowerCase().startsWith("crop"));
      if (!hasCropTransformations) { 
        return;
      }
      const canvasJson = extractJsonData(activeTransformations, "crop");
      if (canvasJson) {
        canvasEditor.clear();
        try {
          canvasEditor.loadFromJSON(canvasJson, () => {
            canvasEditor.requestRenderAll();
          });
        } catch (parseError) {
          console.error("Error parsing canvas JSON:", parseError);
          removeAllCropRectangles();
        }
      }

      setIsCropMode(false);
      setSelectedImage(null);
      setOriginalProps(null);
      setSelectedRatio(null);
      setCropRect(null);
      
    } catch (error) {
      console.error("Error resetting crop:", error);
      setIsCropMode(false);
      setSelectedImage(null);
      setOriginalProps(null);
      setSelectedRatio(null);
      setCropRect(null);
      removeAllCropRectangles();
    } finally {
      setProcessingMessage("");
    }
  }

  if (!canvasEditor) {
    return (
      <div className="p-4">
        <p className="text-white/70 text-sm">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && <BarLoader width={"100%"} color="#00bcd4" />}
      <div className="flex gap-2 justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-sm p-3">
        <div>
          <p className="text-cyan-400 text-sm font-medium">
            ✂️ Crop Mode Active
          </p>
          <p className="text-cyan-300/80 text-xs mt-1">
            {isCropMode ? "Adjust the blue rectangle to set crop area" : "Crop area not set"}
          </p>
        </div>
        <Button disabled={loading} variant={"glass"} size={"sm"} onClick={handleCropReset} className='text-white/70 hover:text-white'>
          <RotateCcw className='h-4 w-4 mr-2' />
          Reset
        </Button>
      </div>

      {/* Show aspect ratios when there's an image available, regardless of crop mode */}
      
      <div>
        <h3 className="text-sm font-medium text-white mb-3">
          {isCropMode ? "Crop Aspect Ratios" : "Select Crop Aspect Ratio"}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {ASPECT_RATIOS.map((ratio) => {
            const Icon = ratio.icon;
            
            return (
              <button 
                key={ratio.label}
                onClick={() => handleAspectRatioClick(ratio.value)}
                className={`cursor-pointer text-center p-3 border rounded-sm transition-color ${selectedRatio === ratio.value ? "border-cyan-400 bg-cyan-400/10": "border-white/20 hover:border-white/40 hover:bg-white/5"}`}
              >
                <div>
                  <Icon className="h-6 w-6 mx-auto mb-2 text-white" />
                </div>
                <div className="text-xs text-white">{ratio.label}</div>
                {ratio.ratio && (
                  <div className="text-xs text-white/70">{ratio.ratio}</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/10">
        <Button disabled={!isCropMode} onClick={applyCrop} className="w-full" variant="primary">
          <CheckCheck className="h-4 w-4 mr-2" />
          Apply Crop
        </Button>

        <Button disabled={!isCropMode} variant="outline" onClick={() => exitCropMode()} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Layer Controls - Show when image is selected but not in crop mode */}
   
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="text-sm font-medium text-white mb-2">Layer Controls</div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={sendImageBehindText} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <MoveDown className="h-3 w-3 mr-1" />
            Behind Text
          </Button>
          <Button 
            onClick={bringImageInFrontOfText} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <MoveUp className="h-3 w-3 mr-1" />
            Front of Text
          </Button>
        </div>
        <p className="text-xs text-white/60">
          Control whether the image appears behind or in front of text elements.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-slate-700/30 rounded-lg p-3">
        <p className="text-xs text-white/70">
          <strong>How to crop:</strong>
          <br />
          1. Click {`"Start Cropping"`}
          <br />
          2. Drag the blue rectangle to select crop area
          <br />
          3. Choose aspect ratio (optional)
          <br />
          4. Click {`"Apply Crop"`} to finalize
        </p>
      </div>
    </div>
  )
}

export default CropContent