"use client";

import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/Context";
import { Project } from "@/types";
import axios from "axios";
import { 
    ArrowUp, 
    ArrowDown, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    Grid3X3, 
    MousePointer2, 
    RotateCcw, 
    ChevronDown 
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

interface CanvasSizeControlsProps {
    project: Project;
}

export default function CanvasSizeControls({ project }: CanvasSizeControlsProps) {
    const { canvasEditor } = useCanvas();
    const [canvasControlsOpen, setCanvasControlsOpen] = useState<boolean>(false);
    const [buttonPressed, setButtonPressed] = useState<string | null>(null);
    const debouncedSaveRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Get container dimensions and limits
    const getCanvasLimits = () => {
        if (!canvasEditor) {
            return { maxWidth: 1000, maxHeight: 700, minWidth: 50, minHeight: 50 };
        }
        
        // Use viewport-based calculations with proper margins
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Conservative calculation: leave good margins for UI and visual breathing room
        const sidebarWidth = 280;   // Left sidebar
        const topBarHeight = 80;    // Top controls
        const rightMargin = 80;     // Right margin for visual space
        const bottomMargin = 60;    // Bottom margin for visual space
        const extraPadding = 40;    // Additional padding for comfort
        
        const availableWidth = viewportWidth - sidebarWidth - rightMargin - extraPadding;
        const availableHeight = viewportHeight - topBarHeight - bottomMargin - extraPadding;
        
        // Set limits with good margins - these will be the max for both increment and reset
        const limits = {
            maxWidth: Math.max(600, availableWidth),     // At least 600px, with margins
            maxHeight: Math.max(500, availableHeight),   // At least 500px, with margins
            minWidth: 50,
            minHeight: 50
        };
        return limits;
    };

    // Continuous button press handler
    useEffect(() => {
        if (!buttonPressed) return;

        const interval = setInterval(() => {
            if (buttonPressed === 'incHorz') {
                handleIncHorz();
            } else if (buttonPressed === 'incVert') {
                handleIncVert();
            } else if (buttonPressed === 'decHorz') {
                handleDecHorz();
            } else if (buttonPressed === 'decVert') {
                handleDecVert();
            }
        }, 100);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buttonPressed]);

    // Auto-save function for smooth operations
    useEffect(() => {
        if (!canvasEditor) return;
        
        if (debouncedSaveRef.current) {
            clearTimeout(debouncedSaveRef.current);
        }
        
        debouncedSaveRef.current = setTimeout(async () => {
            try {
                const canvasJSON = canvasEditor.toJSON();
                await axios.post(`/api/projects/${project.id}`, {
                    width: project.width,
                    height: project.height,
                    canvasState: canvasJSON,
                    currentImageUrl: project.currentImageUrl,
                    activeTransformations: project.activeTransformations,
                    backgroundRemoved: project.backgroundRemoved,
                });
            } catch (error) {
                console.error("Error auto-saving canvas:", error);
            }
        }, 1000);
    }, [project.width, project.height, canvasEditor, project.id, project.currentImageUrl, project.activeTransformations, project.backgroundRemoved]);

    const handleResetCanvasSize = async () => {
        if (!canvasEditor) return;
        
        try {
            // Use the EXACT same limits as the increment functions
            const { maxWidth, maxHeight } = getCanvasLimits();
            
            // Reset to the maximum allowed size (same as inc functions)
            const resetWidth = maxWidth;
            const resetHeight = maxHeight;
            
            // Store current objects with their complete state (including effects)
            const currentObjects = canvasEditor.getObjects();
            
            // Resize canvas to maximum allowed dimensions
            canvasEditor.setWidth(resetWidth);
            canvasEditor.setHeight(resetHeight);
            canvasEditor.setDimensions({
                width: resetWidth,
                height: resetHeight,
            }, { backstoreOnly: false });
            
            // Calculate canvas center
            const canvasCenterX = resetWidth / 2;
            const canvasCenterY = resetHeight / 2;
            
            // Center each object individually while preserving ALL properties including effects
            currentObjects.forEach(obj => {
                // Center the object on the new canvas
                obj.set({
                    left: canvasCenterX,
                    top: canvasCenterY,
                    originX: 'center',
                    originY: 'center'
                });
                
                // Update object coordinates
                obj.setCoords();
            });
            
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            
            // Save the updated state with preserved effects
            const newCanvasJSON = canvasEditor.toJSON();
            await axios.post(`/api/projects/${project.id}`, {
                width: resetWidth,
                height: resetHeight,
                canvasState: newCanvasJSON,
                currentImageUrl: project.currentImageUrl,
                activeTransformations: project.activeTransformations,
                backgroundRemoved: project.backgroundRemoved,
            });
            
            // Update project dimensions
            project.width = resetWidth;
            project.height = resetHeight;
            
            toast.success(`Canvas reset to ${resetWidth}x${resetHeight}px with centered content`);
        } catch (error) {
            console.error("Error resetting canvas size:", error);
            toast.error("Failed to reset canvas size. Please try again.");
        }
    };

    const handleIncHorz = async () => {
        if (!canvasEditor) {
            toast.error("Canvas not ready");
            return;
        }
        
        const { maxWidth } = getCanvasLimits();
        const currentWidth = canvasEditor.getWidth();
        
        if (currentWidth >= maxWidth) {
            toast.info(`Canvas is already at maximum width (${maxWidth}px)`);
            return;
        }
        
        const increaseAmount = 50; // Larger increase for testing
        const newWidth = Math.min(maxWidth, currentWidth + increaseAmount);
        
        try {
            const currentHeight = canvasEditor.getHeight();
            const currentObjects = canvasEditor.getObjects();
            const widthIncrease = newWidth - currentWidth;
            
            // Resize canvas
            canvasEditor.setWidth(newWidth);
            canvasEditor.setDimensions({
                width: newWidth,
                height: currentHeight,
            }, { backstoreOnly: false });
            
            // Move objects to maintain their relative position
            currentObjects.forEach(obj => {
                const currentLeft = obj.left || 0;
                obj.set({ left: currentLeft + (widthIncrease / 2) });
                obj.setCoords();
            });
            
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            
            // Update project width immediately
            project.width = newWidth;
            
            toast.success(`Canvas width increased to ${newWidth}px`);
            
        } catch (error) {
            console.error("❌ Error expanding canvas horizontally:", error);
            toast.error("Failed to expand canvas horizontally");
        }
    };

    const handleIncVert = async () => {
        if (!canvasEditor) {
            toast.error("Canvas not ready");
            return;
        }
        
        const { maxHeight } = getCanvasLimits();
        const currentHeight = canvasEditor.getHeight();
        
        if (currentHeight >= maxHeight) {
            toast.info(`Canvas is already at maximum height (${maxHeight}px)`);
            return;
        }
        
        const increaseAmount = 50; // Larger increase for testing
        const newHeight = Math.min(maxHeight, currentHeight + increaseAmount);
        
        try {
            const currentWidth = canvasEditor.getWidth();
            const currentObjects = canvasEditor.getObjects();
            const heightIncrease = newHeight - currentHeight;
            
            // Resize canvas
            canvasEditor.setHeight(newHeight);
            canvasEditor.setDimensions({
                width: currentWidth,
                height: newHeight,
            }, { backstoreOnly: false });
            
            // Move objects to maintain their relative position
            currentObjects.forEach(obj => {
                const currentTop = obj.top || 0;
                obj.set({ top: currentTop + (heightIncrease / 2) });
                obj.setCoords();
            });
            
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            
            // Update project height immediately
            project.height = newHeight;
            
            toast.success(`Canvas height increased to ${newHeight}px`);
            
        } catch (error) {
            console.error("❌ Error expanding canvas vertically:", error);
            toast.error("Failed to expand canvas vertically");
        }
    };

    const handleDecHorz = async () => {
        if (!canvasEditor) return;
        
        const { minWidth } = getCanvasLimits();
        const currentWidth = canvasEditor.getWidth();
        
        if (currentWidth <= minWidth) {
            toast.info("Canvas is already at minimum width");
            return;
        }
        
        const decreaseAmount = 20;
        const newWidth = Math.max(minWidth, currentWidth - decreaseAmount);
        
        try {
            const currentHeight = canvasEditor.getHeight();
            const currentObjects = canvasEditor.getObjects();
            const widthDecrease = currentWidth - newWidth;
            
            // Resize canvas
            canvasEditor.setWidth(newWidth);
            canvasEditor.setDimensions({
                width: newWidth,
                height: currentHeight,
            }, { backstoreOnly: false });
            
            // Adjust objects to fit within new canvas bounds
            currentObjects.forEach(obj => {
                const currentLeft = obj.left || 0;
                const newLeft = Math.max(0, Math.min(newWidth, currentLeft - (widthDecrease / 2)));
                obj.set({ left: newLeft });
                obj.setCoords();
            });
            
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            
            // Update project width immediately
            project.width = newWidth;
            
        } catch (error) {
            console.error("Error decreasing canvas width:", error);
            toast.error("Failed to decrease canvas width");
        }
    };

    const handleDecVert = async () => {
        if (!canvasEditor) return;
        
        const { minHeight } = getCanvasLimits();
        const currentHeight = canvasEditor.getHeight();
        
        if (currentHeight <= minHeight) {
            toast.info("Canvas is already at minimum height");
            return;
        }
        
        const decreaseAmount = 20;
        const newHeight = Math.max(minHeight, currentHeight - decreaseAmount);
        
        try {
            const currentWidth = canvasEditor.getWidth();
            const currentObjects = canvasEditor.getObjects();
            const heightDecrease = currentHeight - newHeight;
            
            // Resize canvas
            canvasEditor.setHeight(newHeight);
            canvasEditor.setDimensions({
                width: currentWidth,
                height: newHeight,
            }, { backstoreOnly: false });
            
            // Adjust objects to fit within new canvas bounds
            currentObjects.forEach(obj => {
                const currentTop = obj.top || 0;
                const newTop = Math.max(0, Math.min(newHeight, currentTop - (heightDecrease / 2)));
                obj.set({ top: newTop });
                obj.setCoords();
            });
            
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            
            // Update project height immediately
            project.height = newHeight;
            
        } catch (error) {
            console.error("Error decreasing canvas height:", error);
            toast.error("Failed to decrease canvas height");
        }
    };

    return (
        <div className="relative">
            <Button 
                onClick={() => setCanvasControlsOpen(!canvasControlsOpen)}
                variant={"ghost"} 
                size={"sm"} 
                className={`
                    text-white hover:bg-white/10 p-2 min-w-0 group relative
                    transition-all duration-200 ease-out
                    ${canvasControlsOpen ? 'bg-white/10 shadow-lg' : ''}
                `}
                title="Canvas controls"
            >
                <Grid3X3 className={`h-4 w-4 transition-transform duration-200 ${canvasControlsOpen ? 'rotate-45' : ''}`} />
                <span className="hidden md:inline ml-2 text-sm font-medium">Canvas</span>
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${canvasControlsOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Modern Popover Panel */}
            {canvasControlsOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setCanvasControlsOpen(false)}
                    />
                    
                    {/* Popover Content */}
                    <div className="absolute top-full mt-2 right-0 z-50 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                            <div className="flex items-center gap-2">
                                <Grid3X3 className="h-4 w-4 text-blue-400" />
                                <h3 className="text-white font-semibold text-sm">Canvas Controls</h3>
                                <div className="ml-auto text-xs text-white/60 font-mono">
                                    {project.width || 800} × {project.height || 600}px
                                </div>
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="p-4 space-y-4">
                            {/* Quick Reset */}
                            <div className="space-y-2">
                                <div className="text-xs text-white/70 font-medium uppercase tracking-wide">Quick Actions</div>
                                <Button 
                                    onClick={() => {
                                        handleResetCanvasSize();
                                        setCanvasControlsOpen(false);
                                    }}
                                    variant={"ghost"} 
                                    className="w-full text-white hover:bg-blue-500/20 border border-white/10 rounded-lg p-3 group"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                                    <span className="flex-1 text-left">Reset to Full Size</span>
                                </Button>
                            </div>

                            {/* Size Adjustments */}
                            <div className="space-y-3">
                                <div className="text-xs text-white/70 font-medium uppercase tracking-wide">Resize Canvas</div>
                                
                                {/* Width Controls */}
                                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ArrowLeftIcon className="h-3 w-3 text-white/60" />
                                        <span className="text-xs text-white/70 font-medium">Width</span>
                                        <ArrowRightIcon className="h-3 w-3 text-white/60" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            onClick={handleDecHorz}
                                            onMouseDown={() => setButtonPressed('decHorz')}
                                            onMouseUp={() => setButtonPressed(null)}
                                            onMouseLeave={() => setButtonPressed(null)}
                                            variant={"ghost"} 
                                            size={"sm"} 
                                            className="flex-1 text-white hover:bg-red-500/20 border border-red-500/20 rounded-md select-none group"
                                            title="Decrease width (hold to continue)"
                                        >
                                            <ArrowLeftIcon className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs ml-1">Decrease</span>
                                        </Button>
                                        <Button 
                                            onClick={handleIncHorz}
                                            onMouseDown={() => setButtonPressed('incHorz')}
                                            onMouseUp={() => setButtonPressed(null)}
                                            onMouseLeave={() => setButtonPressed(null)}
                                            variant={"ghost"} 
                                            size={"sm"} 
                                            className="flex-1 text-white hover:bg-green-500/20 border border-green-500/20 rounded-md select-none group"
                                            title="Increase width (hold to continue)"
                                        >
                                            <ArrowRightIcon className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs ml-1">Increase</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Height Controls */}
                                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ArrowUp className="h-3 w-3 text-white/60" />
                                        <span className="text-xs text-white/70 font-medium">Height</span>
                                        <ArrowDown className="h-3 w-3 text-white/60" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            onClick={handleDecVert}
                                            onMouseDown={() => setButtonPressed('decVert')}
                                            onMouseUp={() => setButtonPressed(null)}
                                            onMouseLeave={() => setButtonPressed(null)}
                                            variant={"ghost"} 
                                            size={"sm"} 
                                            className="flex-1 text-white hover:bg-red-500/20 border border-red-500/20 rounded-md select-none group"
                                            title="Decrease height (hold to continue)"
                                        >
                                            <ArrowDown className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs ml-1">Decrease</span>
                                        </Button>
                                        <Button 
                                            onClick={handleIncVert}
                                            onMouseDown={() => setButtonPressed('incVert')}
                                            onMouseUp={() => setButtonPressed(null)}
                                            onMouseLeave={() => setButtonPressed(null)}
                                            variant={"ghost"} 
                                            size={"sm"} 
                                            className="flex-1 text-white hover:bg-green-500/20 border border-green-500/20 rounded-md select-none group"
                                            title="Increase height (hold to continue)"
                                        >
                                            <ArrowUp className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs ml-1">Increase</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Tip */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <MousePointer2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-blue-200">
                                        <div className="font-medium mb-1">Pro Tip</div>
                                        <div className="text-blue-200/80">Hold down any resize button for continuous adjustment. Release to stop.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
