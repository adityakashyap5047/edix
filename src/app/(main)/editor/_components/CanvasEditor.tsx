"use client";

import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, FabricImage } from "fabric";
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

const CanvasEditor = ({project}: {project: Project}) => {

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { canvasEditor, setCanvasEditor, activeTool } = useCanvas();

    const calculateCanvasDimensions = useCallback(() => {
        if (!containerRef.current || !project) return { 
            canvasWidth: project?.width || 800, 
            canvasHeight: project?.height || 600, 
            scale: 1 
        };

        const container = containerRef.current;
        // Use 80% of container dimensions for canvas editing space
        const availableWidth = (container.clientWidth - 40) * 0.8; // 80% of width minus padding
        const availableHeight = (container.clientHeight - 40) * 0.8; // 80% of height minus padding

        // Calculate scale to fit the project within 80% space while maintaining aspect ratio
        const scaleX = availableWidth / project.width;
        const scaleY = availableHeight / project.height;
        const scale = Math.min(scaleX, scaleY, 1);

        // Use the 80% space as canvas dimensions
        return {
            canvasWidth: availableWidth,
            canvasHeight: availableHeight,
            scale
        };
    }, [containerRef, project]);

    const savedCanvasState = useCallback(async () => {
        if (!canvasEditor || !project) {
            return;
        }

        try {
            const canvasJSON = canvasEditor.toJSON();

            await axios.post(`/api/projects/${project.id}`, {
                canvasState: canvasJSON
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            toast.success("Project auto-saved");
        } catch (error) {
            const axiosError = error as AxiosError<{ error?: string }>;
            console.error('Error saving canvas state:', axiosError.response?.data || error);
            toast.error(axiosError.response?.data?.error || "Unknown error occurred while auto saving project.");
        }
    }, [canvasEditor, project]);

    // Handle window resize to adjust canvas dimensions
    useEffect(() => {
        const handleResize = () => {
            if (!canvasEditor || !project) return;

            // Recalculate optimal dimensions for new window size
            const { canvasWidth, canvasHeight, scale } = calculateCanvasDimensions();

            // Update canvas dimensions based on new scale
            canvasEditor.setDimensions({
                width: canvasWidth,
                height: canvasHeight,
            }, {
                backstoreOnly: false
            });

            canvasEditor.setZoom(scale);
            canvasEditor.calcOffset(); // Recalculate offsets for new dimensions
            canvasEditor.requestRenderAll(); // Force re-render to apply changes
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, [canvasEditor, project, calculateCanvasDimensions]);

    // Auto Save
    useEffect(() => {
        if (!canvasEditor) {
            return;
        }

        let saveTimeout: ReturnType<typeof setTimeout>;
        
        // Debounced function - wait 2 seconds after last change
        const handleCanvasChange = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                savedCanvasState();
            }, 5000); // 5 second delay
        }

        // Listen for canvas modification events
        canvasEditor.on("object:modified", handleCanvasChange); // Object transformed/moved
        canvasEditor.on("object:added", handleCanvasChange);    // New Object added
        canvasEditor.on("object:removed", handleCanvasChange);  // Object deleted
        canvasEditor.on("path:created", handleCanvasChange);    // Drawing/freehand
        canvasEditor.on("selection:created", handleCanvasChange); // Selection events
        canvasEditor.on("selection:updated", handleCanvasChange);   // updated selection
        
        // Cleanup function to remove event listeners
        return () => {
            clearTimeout(saveTimeout);
            canvasEditor.off("object:modified", handleCanvasChange);
            canvasEditor.off("object:added", handleCanvasChange);
            canvasEditor.off("object:removed", handleCanvasChange);
            canvasEditor.off("path:created", handleCanvasChange);
            canvasEditor.off("selection:created", handleCanvasChange);
            canvasEditor.off("selection:updated", handleCanvasChange);
        };
    }, [canvasEditor, savedCanvasState]);

    // Initialize Canvas 
    useEffect(() => {
        if (!canvasRef.current || !project || canvasEditor) return;
        
        let canvasInstance: Canvas | null = null;
        
        const initializeCanvas = async () => {
            setIsLoading(true);

            const { canvasWidth, canvasHeight, scale } = calculateCanvasDimensions();

            const canvas = new Canvas(canvasRef.current!, {
                width: canvasWidth,    // Use 80% of container width
                height: canvasHeight, // Use 80% of container height

                backgroundColor: "#fff",    // Default white background

                preserveObjectStacking: true, // Maintain object layer order
                controlsAboveOverlay: true, // Show selection controls above overlay
                selection: true, // Enable object selection

                hoverCursor: "move", // Cursor when hovering over objects
                moveCursor: "move", // Cursor when moving objects
                defaultCursor: "default", // Default cursor

                allowTouchScrolling: false, // Disable touch scrolling(prevents conflict)
                renderOnAddRemove: true, // Auto-render when objects are added/removed 
                skipTargetFind: false, // Allow object targeting for interaction
            });

            canvasInstance = canvas;

            canvas.setDimensions({
                width: canvasWidth, // Display width using 80% of container
                height: canvasHeight, // Display height using 80% of container
            }, {
                backstoreOnly: false
            })

            // Apply zoom to scale the content appropriately
            canvas.setZoom(scale);

            // High DPI handling
            const scaleFactor = window.devicePixelRatio || 1;
            if (scaleFactor > 1) {
                // Increase canvas resolution for high DPI displays
                canvas.getElement().width = canvasWidth * scaleFactor;
                canvas.getElement().height = canvasHeight * scaleFactor;
                // Scale the drawing context to match
                canvas.getContext().scale(scaleFactor, scaleFactor);
            }

            if (project.currentImageUrl || project.originalImageUrl) {
                try {
                    // Use current image if available
                    const imageUrl = project.currentImageUrl || project.originalImageUrl;

                    const fabricImage = await FabricImage.fromURL(imageUrl!, {
                        crossOrigin: "anonymous", // Handle CORS for external images
                    })

                    // Calculate scaling to fit image within the project dimensions
                    const imgAspectRatio = fabricImage.width / fabricImage.height;
                    const projectAspectRatio = project.width / project.height;
                    let scaleX, scaleY;

                    if (imgAspectRatio > projectAspectRatio) {
                        // Image is wider than project - scale based on width
                        scaleX = project.width / fabricImage.width;
                        scaleY = scaleX;    // Maintain aspect ratio
                    } else {
                        // Image is taller than project - scale based on height
                        scaleY = project.height / fabricImage.height;
                        scaleX = scaleY;    // Maintain aspect ratio
                    }

                    fabricImage.set({
                        left: canvasWidth / 2, // Center horizontally in the larger canvas
                        top: canvasHeight / 2, // Center vertically in the larger canvas
                        originX: "center", // Transform origin at center
                        originY: "center", // Transform origin at center
                        scaleX: scaleX * scale,// Horizontal scale factor adjusted for canvas scale
                        scaleY: scaleY * scale, // Vertical scale factor adjusted for canvas scale
                        selectable: true, // Allow user to select/move image
                        evented: true, // Enable mouse/touch events
                    })

                    // Add image to canvas and ensure it's centered
                    canvas.add(fabricImage);
                    canvas.centerObject(fabricImage);
                } catch (error) {
                    console.error("Error loading project image:", error);
                    toast.error("Error loading Project Image at Canvas Editor")
                }
            }

            // Load saved canvas state
            if (project.canvasState) {
                try {
                    // Load json state - this will restore all objects and their propertie
                    await canvas.loadFromJSON(project.canvasState);
                    canvas.requestRenderAll();  // Force re-render after loading state
                } catch (error) {
                    console.error("Error loading canvas state:", error);
                    toast.error("Error loading Canvas State")
                }
            }

            canvas.calcOffset();
            canvas.requestRenderAll();
            setCanvasEditor(canvas);

            setTimeout(() => {
                window.dispatchEvent(new Event("resize")); // Trigger resize to adjust layout
            }, 500); // Delay to ensure canvas is fully initialized

            setIsLoading(false);
        }

        initializeCanvas();

        // Cleanup function
        return () => {
            // Clean up the canvas instance if it exists
            if (canvasInstance) {
                canvasInstance.dispose();
                canvasInstance = null;
            }
            setCanvasEditor(null);
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, calculateCanvasDimensions, setCanvasEditor]);

    // Switch cursor based on active tool
    useEffect(() => {
        if (!canvasEditor || !containerRef.current) return;

        switch (activeTool) {
            case "crop":
                // Crop tool shows crosshair cursor for precision selection
                canvasEditor.defaultCursor = "crosshair";
                canvasEditor.hoverCursor = "crosshair";
                break;
            default:
                // Default tool shows standard cursor
                canvasEditor.defaultCursor = "default";
                canvasEditor.hoverCursor = "move";
        }
    }, [activeTool, canvasEditor, containerRef]);

    return (
        <div 
            ref={containerRef}
            className='relative flex items-center justify-center bg-secondary w-full h-full overflow-hidden'
        >
            <div 
                className='absolute inset-0 opacity-10 pointer-events-none'
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, #64748b 25%, transparent 25%),
                        linear-gradient(-45deg, #64748b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #64748b 75%),
                        linear-gradient(-45deg, transparent 75%, #64748b 75%),
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
            />

            {isLoading && <div className='absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10'>
                <div className='flex flex-col items-center gap-4'>
                    <Loader2 className='animate-spin w-8 h-8' />{" "}
                    <p className='text-white/70 text-sm'>Loading canvas...</p>
                </div>
            </div>}

            <div className='px-5'>
                <canvas id="canvas" ref={canvasRef} className='border' />
            </div>
        </div>
    )
}

export default CanvasEditor