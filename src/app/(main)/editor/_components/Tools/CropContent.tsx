"use client";

import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/Context";
import { FabricImage, Rect } from "fabric";
import { CheckCheck, Crop, Maximize, RectangleHorizontal, RectangleVertical, Smartphone, Square, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [originalProps, setOriginalProps] = useState(null);

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

  useEffect(() => {
    if (activeTool === "crop" && canvasEditor && isCropMode) {
      const image = getActiveImage();

      if (image) {
        // initializeCropMode(image);
      }
    } else if (activeTool !== "crop" && isCropMode) {
      exitCropMode();
    }
  }, [activeTool, canvasEditor, isCropMode, getActiveImage]);

  useEffect(() => {
    return () => {
      if (isCropMode) {
        exitCropMode();
      }
    }
  }, [])

  const removeAllCropRectangles = () => {
    if (!canvasEditor) return;

    const objects = canvasEditor.getObjects();
    const rectsToRemove = objects.filter(obj => obj.type === "rect");

    rectsToRemove.forEach(rect => {
      canvasEditor?.remove(rect);
    });

    canvasEditor.requestRenderAll();
  }

  const createCropRectangle = (image: any) => {
    const bounds = image.getBoundingRect();

    const cropRectangle  = new Rect({
      left: bounds.left + bounds.width * 0.1,
      top: bounds.top + bounds.height * 0.1,
      width: bounds.width * 0.8,
      height: bounds.height * 0.8,
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

    cropRectangle.on("scaling", (e) => {
      const rect = e.target;

      if(selectedRatio && selectedRatio !== null) {
        const currentRatio = (rect.width * rect.scaleX) / (rect.height * rect.scaleY);
        
        if (Math.abs(currentRatio - selectedRatio) > 0.01) {
          const newHeight = (rect.width * rect.scaleX) / rect.scaleY;
          rect.set("height", newHeight);          
        }
      }

      canvasEditor?.requestRenderAll();
    });

    canvasEditor?.add(cropRectangle);
    canvasEditor?.setActiveObject(cropRectangle);
    setCropRect(cropRectangle);
  }

  const initializeCropMode = (image: any) => {
    if (!canvasEditor || !image || isCropMode) return;

    removeAllCropRectangles();

    const original = {
      left: image.left,
      top: image.top,
      width: image.width,
      height: image.height,
      scaleX: image.scaleX,
      scaleY: image.scaleY,
      angle: image.angle || 0,
      selectable: image.selectable,
      evented: image.evented,
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

  const exitCropMode = () => {
    if(!isCropMode || !canvasEditor) return;

    removeAllCropRectangles();
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
    };

    setIsCropMode(false);
    setSelectedImage(null);
    setOriginalProps(null);
    setSelectedRatio(null);

    if (canvasEditor) {
      canvasEditor.requestRenderAll();
    }
  };

  const applyAspectRatio = (ratio) => {
    setSelectedRatio(ratio);

    if (!cropRect || ratio === null) return;

    const currentWidth = cropRect.width * cropRect.scaleX;
    const newHeight = currentWidth / ratio;

    cropRect.set({
      height: newHeight / cropRect.scaleY,
      scaleY: cropRect.scaleX, // Maintain aspect ratio
    });

    canvasEditor.requestRenderAll();
  };

  const applyCrop = () => {
    if(!selectedImage || !cropRect) return;

    try {
      const cropBounds = cropRect.getBoundingRect();
      const imageBounds = selectedImage.getBoundingRect();

      const cropX = Math.max(0, cropBounds.left - imageBounds.left);
      const cropY = Math.max(0, cropBounds.top - imageBounds.top);
      const cropWidth = Math.min(cropBounds.width, imageBounds.width - cropX);
      const cropHeight = Math.min(cropBounds.height, imageBounds.height - cropY);

      const imageScaleX = selectedImage.scaleX || 1;
      const imageScaleY = selectedImage.scaleY || 1;

      const actualCropX = cropX / imageScaleX;
      const actualCropY = cropY / imageScaleY;

      const actualCropWidth = cropWidth / imageScaleX;
      const actualCropHeight = cropHeight / imageScaleY;

      const croppedImage = new FabricImage(selectedImage._element, {
        left: cropBounds.left + cropBounds.width / 2,
        top: cropBounds.top + cropBounds.height / 2,

        originX: "center",
        originY: "center",
        selectable: true,
        evented: true,

        // Apply Crop using Fabric.js crop properties
        cropX: actualCropX,
        cropY: actualCropY,
        cropWidth: actualCropWidth,
        cropHeight: actualCropHeight,
        scaleX: imageScaleX,
        scaleY: imageScaleY,
      })

      canvasEditor?.remove(selectedImage);
      canvasEditor?.add(croppedImage);

      canvasEditor?.setActiveObject(croppedImage);
      canvasEditor?.requestRenderAll();

      toast.success("Crop applied successfully!");
      exitCropMode();
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