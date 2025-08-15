"use client";

import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, FabricImage } from "fabric";
import { toast } from 'sonner';

const ResponsiveCanvasEditor = ({project}: {project: Project}) => {

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { canvasEditor, setCanvasEditor, activeTool } = useCanvas();

    // Track screen width for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateCanvasDimensions = useCallback(() => {
        if (!containerRef.current || !project) {
            console.log("Container or project not available:", { container: !!containerRef.current, project: !!project });
            return { 
                canvasWidth: project?.width || 800, 
                canvasHeight: project?.height || 600, 
                scale: 1 
            };
        }

        const container = containerRef.current;
        
        // Get stable container dimensions
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Return early if container is too small
        if (containerWidth < 100 || containerHeight < 100) {
            return { 
                canvasWidth: project.width, 
                canvasHeight: project.height, 
                scale: 1 
            };
        }
        
        // Detect device type for margin calculation
        const isMobile = screenWidth < 768;
        const isTablet = screenWidth >= 768 && screenWidth < 1024;
        
        // Responsive margins based on screen size
        const margin = isMobile ? 4 : isTablet ? 8 : 12;
        
        // Calculate available space
        const maxWidth = Math.max(containerWidth - margin, 150);
        const maxHeight = Math.max(containerHeight - margin, 100);

        // Check if "resize" exists in activeTransformations
        const hasResizeTransformation = project.activeTransformations && 
            project.activeTransformations.split('-').includes('resize');

        if (hasResizeTransformation) {
            // Scale the project to fit the container while maintaining aspect ratio
            const scaleX = maxWidth / project.width;
            const scaleY = maxHeight / project.height;
            
            // Use the smaller scale to ensure canvas fits within container
            let scale = Math.min(scaleX, scaleY);
            
            // Ensure minimum scale for usability
            scale = Math.max(scale, 0.1);
            
            return {
                canvasWidth: Math.round(project.width * scale),
                canvasHeight: Math.round(project.height * scale),
                scale: scale
            };
        } else {
            // Use project dimensions as-is, but ensure they fit in container
            const scaleToFit = Math.min(maxWidth / project.width, maxHeight / project.height);
            const finalScale = Math.min(scaleToFit, 1); // Don't scale up beyond 100%
            
            return {
                canvasWidth: Math.round(project.width * finalScale),
                canvasHeight: Math.round(project.height * finalScale),
                scale: finalScale
            };
        }
    }, [project, screenWidth]);

    // Handle window resize to adjust canvas dimensions
    useEffect(() => {
        if (!canvasEditor || !project) return;

        const handleResize = () => {
            // Recalculate optimal dimensions for new window size
            const { canvasWidth, canvasHeight, scale } = calculateCanvasDimensions();

            // Update canvas dimensions based on new scale
            canvasEditor.setDimensions({
                width: canvasWidth,
                height: canvasHeight,
            });

            // Apply the calculated scale
            canvasEditor.setZoom(scale);
            canvasEditor.requestRenderAll();
        };

        // Debounced resize for better performance
        let resizeTimeout: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 100);
        };

        window.addEventListener("resize", debouncedResize);
        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener("resize", debouncedResize);
        };
    }, [canvasEditor, project, calculateCanvasDimensions]);

    // Initialize Canvas 
    useEffect(() => {
        if (!canvasRef.current || !project || canvasEditor) return;
        
        console.log("Starting canvas initialization...");
        
        let canvasInstance: Canvas | null = null;
        
        const initializeCanvas = async () => {
            try {
                setIsLoading(true);

                const { canvasWidth, canvasHeight, scale } = calculateCanvasDimensions();
                console.log("Canvas dimensions calculated:", { canvasWidth, canvasHeight, scale });

            // Check if "resize" exists in activeTransformations to determine canvas creation dimensions
            const hasResizeTransformation = project.activeTransformations && 
                project.activeTransformations.split('-').includes('resize');

            const canvas = new Canvas(canvasRef.current!, {
                width: hasResizeTransformation ? project.width : canvasWidth,
                height: hasResizeTransformation ? project.height : canvasHeight,
                backgroundColor: "#fff",
                preserveObjectStacking: true,
                controlsAboveOverlay: true,
                selection: true,
                hoverCursor: "move",
                moveCursor: "move",
                defaultCursor: "default",
                allowTouchScrolling: false,
                renderOnAddRemove: true,
                skipTargetFind: false,
            });

            canvasInstance = canvas;

            canvas.setDimensions({
                width: canvasWidth,
                height: canvasHeight,
            }, {
                backstoreOnly: false
            });

            // Apply zoom to scale the content appropriately
            canvas.setZoom(scale);

            // High DPI handling
            const scaleFactor = window.devicePixelRatio || 1;
            if (scaleFactor > 1) {
                canvas.getElement().width = canvasWidth * scaleFactor;
                canvas.getElement().height = canvasHeight * scaleFactor;
                canvas.getContext().scale(scaleFactor, scaleFactor);
            }

            if (project.currentImageUrl || project.originalImageUrl) {
                try {
                    const imageUrl = project.currentImageUrl || project.originalImageUrl;

                    const fabricImage = await FabricImage.fromURL(imageUrl!, {
                        crossOrigin: "anonymous",
                    });

                    // Calculate scaling to fit image within the project dimensions
                    const imgAspectRatio = fabricImage.width / fabricImage.height;
                    const projectAspectRatio = project.width / project.height;
                    let scaleX, scaleY;

                    if (imgAspectRatio > projectAspectRatio) {
                        scaleX = project.width / fabricImage.width;
                        scaleY = scaleX;
                    } else {
                        scaleY = project.height / fabricImage.height;
                        scaleX = scaleY;
                    }

                    const centerX = project.width / 2;
                    const centerY = project.height / 2;

                    fabricImage.set({
                        left: centerX,
                        top: centerY,
                        originX: "center",
                        originY: "center",
                        scaleX: scaleX,
                        scaleY: scaleY,
                        selectable: true,
                        evented: true,
                    });

                    canvas.add(fabricImage);
                    canvas.centerObject(fabricImage);
                } catch (error) {
                    console.error("Error loading project image:", error);
                    toast.error("Error loading Project Image");
                }
            }

            // Load saved canvas state
            if (project.canvasState) {
                try {
                    await canvas.loadFromJSON(project.canvasState);
                    canvas.requestRenderAll();
                } catch (error) {
                    console.error("Error loading canvas state:", error);
                    toast.error("Error loading Canvas State");
                }
            }

            canvas.calcOffset();
            canvas.requestRenderAll();
            setCanvasEditor(canvas);
            
            console.log("Responsive Canvas initialized (screen width:", screenWidth, "px):", canvas);

            setIsLoading(false);
        } catch (error) {
            console.error("Error initializing canvas:", error);
            setIsLoading(false);
        }
        };

        initializeCanvas();

        // Safety timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.error("Canvas initialization timeout");
                setIsLoading(false);
            }
        }, 10000); // 10 second timeout

        // Cleanup function
        return () => {
            clearTimeout(timeout);
            if (canvasInstance) {
                canvasInstance.dispose();
                canvasInstance = null;
            }
            setCanvasEditor(null);
        };
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, setCanvasEditor]);    // Switch cursor based on active tool
    useEffect(() => {
        if (!canvasEditor) return;

        switch (activeTool) {
            case "crop":
                canvasEditor.defaultCursor = "crosshair";
                canvasEditor.hoverCursor = "crosshair";
                break;
            default:
                canvasEditor.defaultCursor = "default";
                canvasEditor.hoverCursor = "move";
        }
    }, [activeTool, canvasEditor]);

    // Handle selection events for tool changes
    useEffect(() => {
        if (!canvasEditor) return;

        const handleSelection = (e: { selected?: { type: string }[] }) => {
            const selectedObjects = e.selected;
            if (selectedObjects && selectedObjects.length > 0) {
                // Handle selection logic if needed
            }
        };

        canvasEditor.on("selection:created", handleSelection);
        canvasEditor.on("selection:updated", handleSelection);
        
        return () => {
            canvasEditor.off("selection:created", handleSelection);
            canvasEditor.off("selection:updated", handleSelection);
        };
    }, [canvasEditor]);

    if (isLoading) {
        return (
            <div className="w-full h-full bg-slate-800 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <p className="text-white/70">Loading Canvas...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="w-full h-full bg-slate-800 flex justify-center items-center overflow-hidden"
        >
            <div className="relative">
                <canvas 
                    ref={canvasRef}
                    className="border border-slate-600 rounded-lg shadow-lg bg-white"
                />
            </div>
        </div>
    );
};

export default ResponsiveCanvasEditor;
