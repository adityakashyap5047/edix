"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UpgradeModal from "@/components/UpgradeModal";
import CanvasSizeControls from "./CanvasSizeControls";
import { useCanvas } from "@/context/Context";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Project, ToolId, PremiumTool, User } from "@/types"
import axios from "axios";
import { FabricImage, ImageFormat, TMat2D } from "fabric";
import { ArrowLeft, Crop, Expand, Eye, Maximize2, Palette, Sliders, Text, Lock, Loader2, RefreshCcw, Save, Download, ChevronDown, FileImage } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
                
                <CanvasSizeControls project={project} />
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