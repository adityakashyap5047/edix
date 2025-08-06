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
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeDirection, setResizeDirection] = useState<string>('');
    const [dragStart, setDragStart] = useState<{x: number, y: number, width: number, height: number}>({x: 0, y: 0, width: 0, height: 0});

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);

    const { canvasEditor, setCanvasEditor, activeTool, onToolChange } = useCanvas();

    const canvasScale = 100;

    const calculateCanvasDimensions = useCallback(() => {
        if (!containerRef.current || !project) return { 
            canvasWidth: project?.width || 800, 
            canvasHeight: project?.height || 600, 
            scale: 1 
        };

        // If container hasn't rendered yet, find it using canvas element
        if (!containerRef.current) {
            const canvasElement = canvasRef.current;
            let container = null;
            
            if (canvasElement) {
                container = canvasElement.closest('.bg-secondary');
            }
            
            if (container) {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                const margin = 40;
                const availableWidth = containerWidth - margin;
                const availableHeight = containerHeight - margin;
                
                // Check if "resize" exists in activeTransformations
                const hasResizeTransformation = project.activeTransformations && 
                    project.activeTransformations.split('-').includes('resize');

                if (hasResizeTransformation) {
                    // If resize transformation exists, use project dimensions with scaling
                    const scaleX = availableWidth / project.width;
                    const scaleY = availableHeight / project.height;
                    const scale = Math.min(scaleX, scaleY); // Remove the cap of 1

                    // Calculate scaled project dimensions
                    const displayWidth = project.width * scale;
                    const displayHeight = project.height * scale;

                    return {
                        canvasWidth: displayWidth,
                        canvasHeight: displayHeight,
                        scale
                    };
                } else {
                    // If no resize transformation, use full available area
                    return {
                        canvasWidth: availableWidth,
                        canvasHeight: availableHeight,
                        scale: 1
                    };
                }
            }
            
            // Fallback
            return {
                canvasWidth: project.width,
                canvasHeight: project.height,
                scale: 1
            };
        }

        const container = containerRef.current;
        const margin = 40;
        const availableWidth = container.clientWidth - margin;
        const availableHeight = container.clientHeight - margin;

        // Check if "resize" exists in activeTransformations
        const hasResizeTransformation = project.activeTransformations && 
            project.activeTransformations.split('-').includes('resize');

        if (hasResizeTransformation) {
            // If resize transformation exists, use project dimensions with scaling
            const scaleX = availableWidth / project.width;
            const scaleY = availableHeight / project.height;
            const scale = Math.min(scaleX, scaleY); // Remove the cap of 1

            // Calculate scaled project dimensions
            const displayWidth = project.width * scale;
            const displayHeight = project.height * scale;

            return {
                canvasWidth: displayWidth,
                canvasHeight: displayHeight,
                scale
            };
        } else {
            // If no resize transformation, use full available area
            return {
                canvasWidth: availableWidth,
                canvasHeight: availableHeight,
                scale: 1
            };
        }
    }, [containerRef, canvasRef, project]);

    // Mouse event handlers for canvas resizing
    const handleMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!canvasEditor || !canvasWrapperRef.current) return;
        
        const currentWidth = canvasEditor.getWidth();
        const currentHeight = canvasEditor.getHeight();
        
        setIsResizing(true);
        setResizeDirection(direction);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            width: currentWidth,
            height: currentHeight
        });
        
        // Disable canvas interaction during resize
        canvasEditor.selection = false;
        canvasEditor.defaultCursor = 'default';
    }, [canvasEditor]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !canvasEditor || !canvasWrapperRef.current) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        let newWidth = dragStart.width;
        let newHeight = dragStart.height;
        
        // Calculate new dimensions based on resize direction
        switch (resizeDirection) {
            case 'right':
                newWidth = dragStart.width + deltaX;
                break;
            case 'left':
                newWidth = dragStart.width - deltaX;
                break;
            case 'bottom':
                newHeight = dragStart.height + deltaY;
                break;
            case 'top':
                newHeight = dragStart.height - deltaY;
                break;
            case 'bottom-right':
                newWidth = dragStart.width + deltaX;
                newHeight = dragStart.height + deltaY;
                break;
            case 'bottom-left':
                newWidth = dragStart.width - deltaX;
                newHeight = dragStart.height + deltaY;
                break;
            case 'top-right':
                newWidth = dragStart.width + deltaX;
                newHeight = dragStart.height - deltaY;
                break;
            case 'top-left':
                newWidth = dragStart.width - deltaX;
                newHeight = dragStart.height - deltaY;
                break;
        }
        
        // Apply constraints
        const minSize = 50;
        const maxWidth = containerRef.current ? containerRef.current.clientWidth - 50 : 1200;
        const maxHeight = containerRef.current ? containerRef.current.clientHeight - 50 : 800;
        
        newWidth = Math.max(minSize, Math.min(newWidth, maxWidth));
        newHeight = Math.max(minSize, Math.min(newHeight, maxHeight));
        
        // Update canvas dimensions
        canvasEditor.setDimensions({
            width: newWidth,
            height: newHeight,
        });
        
        // Re-center all objects during resize
        const objects = canvasEditor.getObjects();
        objects.forEach(obj => {
            // Maintain relative position during resize, don't force center
            canvasEditor.centerObject(obj);
        });
        
        canvasEditor.calcOffset();
        canvasEditor.requestRenderAll();
    }, [isResizing, resizeDirection, canvasEditor, dragStart]);

    const handleMouseUp = useCallback(() => {
        if (!canvasEditor) return;
        
        setIsResizing(false);
        setResizeDirection('');
        
        // Re-enable canvas interaction
        canvasEditor.selection = true;
        canvasEditor.defaultCursor = 'default';
        
        // Trigger auto-save after resize by calling savedCanvasState directly
        // Auto-save will be triggered by the existing canvas change listeners
    }, [canvasEditor]);

    // Add global mouse event listeners
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Effect to update canvas when scale changes
    useEffect(() => {
        if (!canvasEditor || !project) return;

        // Recalculate dimensions with new scale
        const { canvasWidth, canvasHeight, scale } = calculateCanvasDimensions();

        // Update canvas dimensions
        canvasEditor.setDimensions({
            width: canvasWidth,
            height: canvasHeight,
        }, {
            backstoreOnly: false
        });

        canvasEditor.setZoom(scale);
        canvasEditor.calcOffset();
        canvasEditor.requestRenderAll();
    }, [canvasScale, canvasEditor, project, calculateCanvasDimensions]);

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

            // Check if "resize" exists in activeTransformations to determine canvas creation dimensions
            const hasResizeTransformation = project.activeTransformations && 
                project.activeTransformations.split('-').includes('resize');

            const canvas = new Canvas(canvasRef.current!, {
                width: hasResizeTransformation ? project.width : canvasWidth,    // Use project width if resized, otherwise display width
                height: hasResizeTransformation ? project.height : canvasHeight, // Use project height if resized, otherwise display height

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
                width: canvasWidth, // Display width 
                height: canvasHeight, // Display height
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

                    // Always position at the actual canvas center (accounting for zoom)
                    const centerX = project.width / 2;
                    const centerY = project.height / 2;

                    fabricImage.set({
                        left: centerX, // Center in project coordinates
                        top: centerY, // Center in project coordinates
                        originX: "center", // Transform origin at center
                        originY: "center", // Transform origin at center
                        scaleX: scaleX, // Use original image scale
                        scaleY: scaleY, // Use original image scale
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
                    // Load json state - this will restore all objects and their properties
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

    useEffect(() => {
        if (!canvasEditor || !onToolChange) return;

        const handleSelection = (e: { selected?: { type: string }[] }) => {
            const selectedObject = e.selected?.[0];

            if (selectedObject && selectedObject.type === "i-text") {
                onToolChange("text");
            }
        }

        canvasEditor.on("selection:created", handleSelection);
        canvasEditor.on("selection:updated", handleSelection);

        return () => {
            canvasEditor.off("selection:created", handleSelection);
            canvasEditor.off("selection:updated", handleSelection);
        }
    }, [canvasEditor, onToolChange]);

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

            <div className='relative'>
                {/* Canvas wrapper with resize handles */}
                <div ref={canvasWrapperRef} className='relative inline-block'>
                    <canvas id="canvas" ref={canvasRef} className='border border-gray-300' />
                    
                    {/* Resize handles */}
                    {canvasEditor && !isLoading && (
                        <>
                            {/* Edge resize zones (invisible areas along entire edges) */}
                            <div
                                className='absolute -top-2 left-0 right-0 h-4 cursor-n-resize'
                                onMouseDown={(e) => handleMouseDown(e, 'top')}
                                title="Resize from top edge"
                            />
                            <div
                                className='absolute -bottom-2 left-0 right-0 h-4 cursor-s-resize'
                                onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                                title="Resize from bottom edge"
                            />
                            <div
                                className='absolute -left-2 top-0 bottom-0 w-4 cursor-w-resize'
                                onMouseDown={(e) => handleMouseDown(e, 'left')}
                                title="Resize from left edge"
                            />
                            <div
                                className='absolute -right-2 top-0 bottom-0 w-4 cursor-e-resize'
                                onMouseDown={(e) => handleMouseDown(e, 'right')}
                                title="Resize from right edge"
                            />
                            
                            {/* Corner resize zones (invisible areas for diagonal resizing) */}
                            <div
                                className='absolute -top-2 -left-2 w-4 h-4 cursor-nw-resize z-10'
                                onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                                title="Resize from top-left corner"
                            />
                            <div
                                className='absolute -top-2 -right-2 w-4 h-4 cursor-ne-resize z-10'
                                onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                                title="Resize from top-right corner"
                            />
                            <div
                                className='absolute -bottom-2 -left-2 w-4 h-4 cursor-sw-resize z-10'
                                onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                                title="Resize from bottom-left corner"
                            />
                            <div
                                className='absolute -bottom-2 -right-2 w-4 h-4 cursor-se-resize z-10'
                                onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                                title="Resize from bottom-right corner"
                            />
                            
                            {/* Resize indicator overlay */}
                            {isResizing && (
                                <div className='absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none z-20' />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CanvasEditor