"use client";

import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, FabricImage } from "fabric";
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

const Editor = ({project}: {project: Project}) => {

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeDirection, setResizeDirection] = useState<string>('');
    const [dragStart, setDragStart] = useState<{x: number, y: number, width: number, height: number}>({x: 0, y: 0, width: 0, height: 0});

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef<boolean>(true);

    const { canvasEditor, setCanvasEditor, activeTool, onToolChange } = useCanvas();

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const canvasScale = 100;

    const calculateCanvasDimensions = useCallback(() => {
        if (!containerRef.current || !project) return { 
            canvasWidth: project?.width || 800, 
            canvasHeight: project?.height || 600, 
            scale: 1 
        };

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
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Absolutely minimal margins to maximize canvas area - reduced for mobile
        const margin = isMobile ? 4 : isTablet ? 8 : 12;
        
        // Calculate available space - use almost everything
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
            
            // Clamp scale to reasonable bounds to prevent extreme scaling
            scale = Math.max(0.1, Math.min(scale, isMobile ? 2 : 1.5));

            return {
                canvasWidth: Math.round(project.width * scale),
                canvasHeight: Math.round(project.height * scale),
                scale: scale
            };
        } else {
            // AGGRESSIVE HEIGHT MAXIMIZATION - Use every pixel possible
            const projectAspectRatio = project.width / project.height;
            
            // Force canvas to use 95% of available height for maximum usage
            const canvasHeight = Math.floor(maxHeight * 0.95);
            
            // Calculate width based on the maximized height
            let canvasWidth = Math.floor(canvasHeight * projectAspectRatio);
            
            // If calculated width exceeds available space, use full width instead
            if (canvasWidth > maxWidth) {
                canvasWidth = Math.floor(maxWidth * 0.95);
                
                return {
                    canvasWidth: canvasWidth,
                    canvasHeight: canvasHeight,
                    scale: 1
                };
            }
            
            // Use maximum height approach
            return {
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                scale: 1
            };
        }
    }, [containerRef, project]);

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
        
        // Check if canvas is properly initialized before updating dimensions
        if (!canvasEditor || !isMountedRef.current) return;
        
        // Additional checks for canvas internal state
        try {
            if (!canvasEditor.getElement() || canvasEditor.disposed) return;
        } catch (error) {
            console.error('Canvas element check failed in mouse move:', error);
            return;
        }

        try {
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
        } catch (error) {
            console.error('Error during canvas resize:', error);
        }
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

        // Check if canvas is properly initialized and not disposed
        if (!canvasEditor || !isMountedRef.current) return;
        
        // Additional checks for canvas internal state
        try {
            if (!canvasEditor.getElement() || canvasEditor.disposed) return;
        } catch (error) {
            console.error('Canvas element check failed:', error);
            return;
        }

        try {
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
        } catch (error) {
            console.error('Error updating canvas dimensions:', error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasScale, canvasEditor, project]);

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
        let isResizing = false;
        
        const handleResize = () => {
            if (!canvasEditor || !project || !containerRef.current || isResizing) return;

            // Check if canvas is properly initialized and not disposed
            if (!canvasEditor || !isMountedRef.current) return;
            
            // Additional checks for canvas internal state
            try {
                if (!canvasEditor.getElement() || canvasEditor.disposed) return;
            } catch (error) {
                console.error('Canvas element check failed in resize:', error);
                return;
            }

            isResizing = true;

            // Simple resize without animation frames
            setTimeout(() => {
                const container = containerRef.current;
                if (!container || !canvasEditor || canvasEditor.disposed || !isMountedRef.current) {
                    isResizing = false;
                    return;
                }

                try {
                    // Get current canvas state
                    const currentDimensions = {
                        width: canvasEditor.getWidth(),
                        height: canvasEditor.getHeight()
                    };
                    const currentZoom = canvasEditor.getZoom();

                    // Recalculate optimal dimensions
                    const { canvasWidth, canvasHeight, scale } = calculateCanvasDimensions();

                    // Only update if width changed significantly (ignore small height changes)
                    const widthDiff = Math.abs(currentDimensions.width - canvasWidth);
                    const scaleDiff = Math.abs(currentZoom - scale);

                    if (widthDiff > 10 || scaleDiff > 0.05) {
                        // Update canvas dimensions
                        canvasEditor.setDimensions({
                            width: canvasWidth,
                            height: canvasHeight,
                        }, {
                            backstoreOnly: false
                        });

                        // Apply new zoom
                        canvasEditor.setZoom(scale);
                        
                        // Recalculate offsets
                        canvasEditor.calcOffset();
                        canvasEditor.requestRenderAll();
                    }
                } catch (error) {
                    console.error('Error handling canvas resize:', error);
                }

                isResizing = false;
            }, 100);
        };

        // Use longer debounce for smoother experience
        const debouncedResize = debounce(handleResize, 300);

        window.addEventListener("resize", debouncedResize);

        // Remove ResizeObserver to reduce resize triggers
        return () => {
            window.removeEventListener("resize", debouncedResize);
        };
    }, [canvasEditor, project, calculateCanvasDimensions]);

    // Debounce utility function
    function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: Parameters<T>) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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

            setIsLoading(false);
        }

        initializeCanvas();

        // Cleanup function
        return () => {
            // Mark component as unmounted
            isMountedRef.current = false;
            
            // Clean up the canvas instance if it exists
            if (canvasInstance) {
                canvasInstance.dispose();
                canvasInstance = null;
            }
            setCanvasEditor(null);
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, setCanvasEditor]);

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

    // Effect to trigger initial resize calculation
    useEffect(() => {
        if (containerRef.current && canvasEditor) {
            // Only trigger if container has reasonable dimensions
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            
            if (rect.width > 100 && rect.height > 100) {
                const timer = setTimeout(() => {
                    // Single gentle resize trigger
                    window.dispatchEvent(new Event("resize"));
                }, 500); // Longer delay to prevent conflicts
                
                return () => clearTimeout(timer);
            }
        }
    }, [canvasEditor]);

    return (
        <div 
            ref={containerRef}
            className='relative w-full h-full overflow-hidden bg-secondary p-2'
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

            <div className='absolute inset-0 w-full h-full flex items-center justify-center'>
                {/* Canvas wrapper with resize handles */}
                <div ref={canvasWrapperRef} className='relative flex-shrink-0'>
                    <canvas id="canvas" ref={canvasRef} className='border border-gray-300 block' />
                    
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

export default Editor