"use client";

import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/Context";
import { FabricImage, Rect, FabricObject } from "fabric";
import { CheckCheck, Crop, Maximize, RectangleHorizontal, RectangleVertical, Smartphone, Square, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  { label: "Freeform", value: null, icon: Maximize },
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

const CropContent = () => {

  const{ canvasEditor, activeTool } = useCanvas();

  const [selectedImage, setSelectedImage] = useState<FabricObject | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [originalProps, setOriginalProps] = useState<OriginalProps | null>(null);

  // Get the currently selected or main image
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

  useEffect(() => {
    if (activeTool === "crop" && canvasEditor && isCropMode) {
      const image = getActiveImage();

      if (image) {
        // initializeCropMode(image);
      }
    } else if (activeTool !== "crop" && isCropMode) {
      exitCropMode();
    }
  }, [activeTool, canvasEditor, isCropMode, getActiveImage, exitCropMode]);

  useEffect(() => {
    return () => {
      if (isCropMode) {
        exitCropMode();
      }
    }
  }, [isCropMode, exitCropMode])

  const createCropRectangle = (image: FabricObject) => {
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
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      name: "cropRect",

      // VISUAL STYLING FOR CROP HANDLES
      cornerColor: "#00bcd4",
      cornerSize: 12,
      transparentCorners: false,
      cornerStyle: "circle",
      borderColor: "#00bcd4",
      borderScaleFactor: 1,

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
  }

  const initializeCropMode = (image: FabricObject) => {
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
    if(!selectedImage || !cropRect) return;

    try {
      const cropBounds = cropRect.getBoundingRect();
      const imageBounds = selectedImage.getBoundingRect();

      // Calculate relative crop coordinates within the image
      const relativeLeft = (cropBounds.left - imageBounds.left) / imageBounds.width;
      const relativeTop = (cropBounds.top - imageBounds.top) / imageBounds.height;
      const relativeWidth = cropBounds.width / imageBounds.width;
      const relativeHeight = cropBounds.height / imageBounds.height;

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

      // Remove the original image and crop rectangle FIRST
      canvasEditor?.remove(selectedImage);
      canvasEditor?.remove(cropRect);

      const croppedImage = new FabricImage(imageElement, {
        left: cropBounds.left + cropBounds.width / 2,
        top: cropBounds.top + cropBounds.height / 2,
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

      canvasEditor?.add(croppedImage);
      canvasEditor?.setActiveObject(croppedImage);
      canvasEditor?.requestRenderAll();

      // Clean up state
      setIsCropMode(false);
      setSelectedImage(null);
      setOriginalProps(null);
      setSelectedRatio(null);
      setCropRect(null);

      toast.success("Crop applied successfully!");
    } catch (error) {
      console.error("Error applying crop:", error);
      toast.error("Failed to apply crop");
      exitCropMode();
    }
  };

  if (!canvasEditor) {
    return (
      <div className="p-4">
        <p className="text-white/70 text-sm">Canvas not ready</p>
      </div>
    );
  }

  const activeImage = getActiveImage();

  return (
    <div className="space-y-6">
      { isCropMode && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-sm p-3">
          <p className="text-cyan-400 text-sm font-medium">
            ✂️ Crop Mode Active
          </p>
          <p className="text-cyan-300/80 text-xs mt-1">
            Adjust the blue rectangle to set crop area
          </p>
        </div>
      )}

      { !isCropMode && activeImage && (
        <Button
          className="w-full hover:!scale-101"
          onClick={() => initializeCropMode(activeImage)}
          variant={"primary"}
        >
          <Crop className="h-4 w-4 mr-2" />
          Start Cropping
        </Button>
      ) }

      {isCropMode && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">
            Crop Aspect Ratios
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {ASPECT_RATIOS.map((ratio) => {
              const Icon = ratio.icon;
              
              return (
                <button 
                  key={ratio.label}
                  onClick={() => applyAspectRatio(ratio.value)}
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
      )}

       {isCropMode && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <Button onClick={applyCrop} className="w-full" variant="primary">
            <CheckCheck className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>

          <Button variant="outline" onClick={() => exitCropMode()} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

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