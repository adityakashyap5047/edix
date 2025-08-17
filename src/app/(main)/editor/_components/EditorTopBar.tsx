"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UpgradeModal from "@/components/UpgradeModal";
import { useCanvas } from "@/context/Context";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Project, ToolId, PremiumTool, User } from "@/types"
import axios from "axios";
import { FabricImage, ImageFormat, TMat2D } from "fabric";
import { ArrowLeft, Crop, Expand, Eye, Maximize2, Palette, Sliders, Text, Lock, Loader2, RefreshCcw, Save, Download, ChevronDown, FileImage, RotateCcw, ArrowUp, ArrowDown, ArrowLeftIcon, ArrowRightIcon, Grid3X3, MousePointer2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

const TOOLS  = [
  {
    id: "resize",
    label: "Resize",
    icon: Expand,
    isActive: true,
  },
  {
    id: "crop",
    label: "Crop",
    icon: Crop,
  },
  {
    id: "adjust",
    label: "Adjust",
    icon: Sliders,
  },
  {
    id: "text",
    label: "Text",
    icon: Text,
  },
  {
    id: "background",
    label: "AI Background",
    icon: Palette,
    proOnly: true,
  },
  {
    id: "ai_extender",
    label: "AI Image Extender",
    icon: Maximize2,
    proOnly: true,
  },
  {
    id: "ai_edit",
    label: "AI Editing",
    icon: Eye,
    proOnly: true,
  },
];

const EXPORT_FORMATS = [
  {
    format: "PNG",
    quality: 1.0,
    label: "PNG (High Quality)",
    extension: "png",
  },
  {
    format: "JPEG",
    quality: 0.9,
    label: "JPEG (90% Quality)",
    extension: "jpg",
  },
  {
    format: "JPEG",
    quality: 0.8,
    label: "JPEG (80% Quality)",
    extension: "jpg",
  },
  {
    format: "WEBP",
    quality: 0.9,
    label: "WebP (90% Quality)",
    extension: "webp",
  },
];

const EditorTopBar = ({project}: {project: Project}) => {

    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
    const [restrictedTool, setRestrictedTool] = useState<ToolId | null>(null);
    const [isReseting, setIsReseting] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<string | null>(null);
    const [canvasControlsOpen, setCanvasControlsOpen] = useState<boolean>(false);

    const { activeTool, onToolChange, canvasEditor } = useCanvas();
    const { hasAccess, canExport, isFree } = usePlanAccess();

    useEffect(() => {
        const getUser = async() => {
            try {
                const response = await axios.get("/api/users");
                if(response.status === 200 ) setUser(response.data);
            } catch (error) {
                console.error("Error Getting User:", error);
            }
        }
        getUser();
    }, []);

    const handleBackToDashboard = () => {
        router.push("/dashboard");
    }

    const handleToolChange = (toolId: ToolId) => {
        if (!hasAccess(toolId)) {
            setRestrictedTool(toolId);
            setShowUpgradeModal(true);
            return;
        }

        onToolChange(toolId);
    };


    const handleResetToOriginal = async () => {
        if (!canvasEditor || !project || !project.originalImageUrl) {
            toast.error("No original image found to reset to");
            return;
        }

        setIsReseting(true);
        try {
            const canvasElement = canvasEditor.getElement();
            const container = canvasElement.closest('.bg-secondary');
            
            if (!container) {
                toast.error("Could not find container for reset");
                return;
            }

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const margin = 40; // Leave some margin
            
            const availableWidth = containerWidth - margin;
            const availableHeight = containerHeight - margin;

            // Clear canvas and set new dimensions
            canvasEditor.clear();
            canvasEditor.backgroundColor = "#f3f4f6"; // Set gray background

            // Set canvas to fill available area
            canvasEditor.setWidth(availableWidth);
            canvasEditor.setHeight(availableHeight);

            // Load the original image
            const fabricImage = await FabricImage.fromURL(project.originalImageUrl, {
                crossOrigin: "anonymous",
            });

            // Calculate scale to fit image optimally in the new canvas
            const imgAspectRatio = (fabricImage.width || 1) / (fabricImage.height || 1);
            const canvasAspectRatio = availableWidth / availableHeight;
            
            // Scale to fit within canvas while maintaining aspect ratio
            const scale = imgAspectRatio > canvasAspectRatio
                ? (availableWidth * 0.9) / (fabricImage.width || 1)  // 90% of canvas width
                : (availableHeight * 0.9) / (fabricImage.height || 1); // 90% of canvas height

            // Set image properties
            fabricImage.set({
                left: availableWidth / 2,
                top: availableHeight / 2,
                originX: "center",
                originY: "center",
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
            });

            // Clear any filters and add to canvas
            fabricImage.filters = [];
            canvasEditor.add(fabricImage);
            canvasEditor.centerObject(fabricImage);
            canvasEditor.setActiveObject(fabricImage);

            // Set canvas display dimensions and zoom
            canvasEditor.setDimensions({
                width: availableWidth,
                height: availableHeight,
            }, { backstoreOnly: false });
            
            canvasEditor.setZoom(1);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();

            // Save the updated state
            const canvasJSON = canvasEditor.toJSON();
            await axios.post(`/api/projects/${project.id}`, {
                width: availableWidth,
                height: availableHeight,
                canvasState: canvasJSON,
                currentImageUrl: project.originalImageUrl,
                activeTransformations: undefined,
                backgroundRemoved: false,
            });

            // Update project dimensions
            project.width = availableWidth;
            project.height = availableHeight;

            toast.success("Canvas reset to original image and resized to fill available area");
        } catch (error) {
            console.error("Error resetting canvas:", error);
            toast.error("Failed to reset canvas. Please try again.");
        } finally {
            setIsReseting(false);
        }
    };

    const handleManualSave = async () => {
        if (!canvasEditor) return;
        setIsSaving(true);
        try {
            const canvasJSON = canvasEditor.toJSON();
            await axios.post(`/api/projects/${project.id}`, {
                width: project.width,
                height: project.height,
                canvasState: canvasJSON,
                currentImageUrl: project.originalImageUrl,
                activeTransformations: undefined,
                backgroundRemoved: false,
            });
            toast.success("Canvas saved successfully");
        } catch (error) {
            console.error("Error saving canvas:", error);
            toast.error("Failed to save canvas. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    const handleExport = (exportConfig: { format: string; quality: number; label: string; extension: string; }) => {
        if (!canvasEditor || !project) {
            toast.error("Canvas not ready for export");
            return;
        }

        if(!canExport(user?.exportsThisMonth || 0)) {
            setRestrictedTool("export");
            setShowUpgradeModal(true);
            return;
        }

        setIsExporting(true);
        setExportFormat(exportConfig.format);

        try {
            // Store current canvas state for restoration
            const currentZoom = canvasEditor.getZoom();
            const currentViewportTransform = [...canvasEditor.viewportTransform];

            // Reset zoom and viewport for accurate export
            canvasEditor.setZoom(1);
            canvasEditor.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvasEditor.setDimensions({
                width: project.width,
                height: project.height,
            });
            canvasEditor.requestRenderAll();

            // Export the canvas
            const dataURL = canvasEditor.toDataURL({
                format: exportConfig.format.toLowerCase() as ImageFormat,
                quality: exportConfig.quality,
                multiplier: 1,
            });

            // Restore original canvas state
            canvasEditor.setZoom(currentZoom);
            canvasEditor.setViewportTransform(currentViewportTransform as TMat2D);
            canvasEditor.setDimensions({
                width: project.width * currentZoom,
                height: project.height * currentZoom,
            });
            canvasEditor.requestRenderAll();

            // Download the image
            const link = document.createElement("a");
            link.download = `${project.title}.${exportConfig.extension}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Image exported as ${exportConfig.format}!`);
        } catch (error) {
            console.error("Error exporting image:", error);
            toast.error("Failed to export image. Please try again.");
        } finally {
            setIsExporting(false);
            setExportFormat(null);
        }
    };

    // State for continuous button press
    const [buttonPressed, setButtonPressed] = useState<string | null>(null);

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

    // Continuous button press handler - use direct calls to avoid dependency issues
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

    // Auto-save function for smooth operations
    const debouncedSaveRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
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

  return (
    <>
        <div className="border-b px-6 py-3">
            <div className="flex items-center justify-between mb-4">
                <Button variant={"ghost"} size={"sm"} onClick={handleBackToDashboard} className="text-white hover:text-gray-300">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    All Projects
                </Button>

                <h1 className="font-extrabold uppercase">{project.title}</h1>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetToOriginal}
                        disabled={isReseting || !project.originalImageUrl}
                        className="gap-2"
                    >
                        {isReseting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            <>
                                <RefreshCcw className="h-4 w-4" />
                                Reset
                            </>
                        )}
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleManualSave}
                        disabled={isSaving || !canvasEditor}
                        className="gap-2"
                    >
                        {isSaving ? (
                            <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                            </>
                        ) : ( 
                            <>
                            <Save className="h-4 w-4" />
                            Save
                            </>
                        )} 
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            variant="glass"
                            size="sm"
                            disabled={isExporting || !canvasEditor}
                            className="gap-2"
                            >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Exporting {exportFormat}...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Export
                                    <ChevronDown className="h-4 w-4" />
                                </>
                            )}
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-slate-800 border-slate-700"
                        >
                            <div className="px-3 py-2 text-sm text-white/70">
                                Export Resolution: {project.width} × {project.height}px
                            </div>

                            <DropdownMenuSeparator className="bg-slate-700" />

                            {EXPORT_FORMATS.map((config, index) => (
                            <DropdownMenuItem
                                key={index}
                                onClick={() => handleExport(config)}
                                className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                            >
                                <FileImage className="h-4 w-4" />
                                <div className="flex-1">
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-white/50">
                                    {config.format} • {Math.round(config.quality * 100)}%
                                    quality
                                </div>
                                </div>
                            </DropdownMenuItem>
                            ))}
                            {isFree && (
                                <div className="px-3 py-2 text-xs text-white/50">
                                    Free Plan: {user?.exportsThisMonth || 0}/20 exports this month
                                    <div className="text-amber-400 mt-1">
                                        Upgrade to Pro for unlimited exports
                                    </div>
                                </div>
                            )} 
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = activeTool === tool.id;
                        const hasToolAccess = hasAccess(tool.id as PremiumTool);

                        return (
                            <Button 
                                key={tool.id}
                                variant={isActive ? "default" : "ghost"}
                                size={'sm'}
                                onClick={() => handleToolChange(tool.id as ToolId)}
                                className={`gap-2 relative ${
                                    isActive
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "text-white hover:text-gray-300 hover:bg-gray-100"
                                    }
                                    ${!hasToolAccess ? "opacity-60" : ""}
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                {tool.label}
                                {tool.proOnly && !hasToolAccess && (
                                    <Lock className="h-3 w-3 text-amber-400" />
                                )}
                            </Button>
                        )
                    })}
                </div>
                
                {/* Modern Canvas Controls - Figma-inspired Popover */}
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
                        
                        {/* Current dimensions badge */}
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded-full font-mono leading-none">
                            {Math.round(project.width || 800)}×{Math.round(project.height || 600)}
                        </div>
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
                                            <span className="text-xs text-white/50">Expand canvas</span>
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
            </div>
        </div>

        {restrictedTool && <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => {
                setShowUpgradeModal(false);
                setRestrictedTool(null);
            }}
            restrictedTool={restrictedTool}
            reason={
                restrictedTool === "export" 
                    ? "Free plan is limited to 20 exports per month. Upgrade to pro for unlimited exports."
                    : undefined
            }
        />}
    </>
  )
}

export default EditorTopBar