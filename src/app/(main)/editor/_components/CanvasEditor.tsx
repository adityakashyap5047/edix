"use client";

import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, FabricImage } from "fabric";
import { toast } from 'sonner';

const CanvasEditor = ({project}: {project: Project}) => {

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasInstanceRef = useRef<Canvas | null>(null);

    const { canvasEditor, setCanvasEditor, activeTool, onToolChange } = useCanvas();

    const calculateViewportScale = useCallback(() => {
        if (!containerRef.current || !project) return 1;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 40; // 40px padding
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / project.width;
        const scaleY = containerHeight / project.height;

        // Use the smaller scale to ensure the canvas fits completely
        // Cap at 1 to prevent upscaling beyond original size
        return Math.min(scaleX, scaleY, 1);
    }, [containerRef, project]);

    useEffect(() => {
        if (!canvasRef.current || !project) return;
        
        // Only initialize if we haven't already initialized
        if (isInitialized) return;
        
        console.log("Initializing canvas editor...");
        const initializeCanvas = async () => {
            setIsLoading(true);

            const viewportScale = calculateViewportScale();

            const canvas = new Canvas(canvasRef.current!, {
                width: project.width,    // logical canvas width(design dimension)
                height: project.height, // logical canvas height(design dimension)

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

            canvas.setDimensions({
                width: project.width * viewportScale, // Scaled display width
                height: project.height * viewportScale, // Scaled display height
            }, {
                backstoreOnly: false
            })

            // Apply zoom to scale the entire canvas content
            canvas.setZoom(viewportScale);

            // High DPI handling
            const scaleFactor = window.devicePixelRatio || 1;
            if (scaleFactor > 1) {
                // Increase canvas resolution for high DPI desplays
                canvas.getElement().width = project.width * scaleFactor;
                canvas.getElement().height = project.height * scaleFactor;
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

                    // Calculate scaling to fit image within canvas while maintaining aspect ratio
                    const imgAspectRatio = fabricImage.width / fabricImage.height;
                    const canvasAspectRatio = project.width / project.height;
                    let scaleX, scaleY;

                    if (imgAspectRatio > canvasAspectRatio) {
                        // Image is wider than canvas - scale based on width
                        scaleX = project.width / fabricImage.width;
                        scaleY = scaleX;    // Maintain aspect ratio
                    } else {
                        // Image is taller than canvas - scale based on height
                        scaleY = project.height / fabricImage.height;
                        scaleX = scaleY;    // Maintain aspect ratio
                    }

                    fabricImage.set({
                        left: project.width / 2, // Center horizontally
                        top: project.height / 2, // Center vertically
                        originX: "center", // Transform origin at center
                        originY: "center", // Transform origin at center
                        scaleX,// Horizontal scale factor
                        scaleY, // Vertical scale factor
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
            canvasInstanceRef.current = canvas;
            setCanvasEditor(canvas);
            setIsInitialized(true);

            setTimeout(() => {
                // workaround for initial resize issues
                window.dispatchEvent(new Event("resize"));
            }, 500);

            setIsLoading(false);
        }

        initializeCanvas();

    }, [project, calculateViewportScale, setCanvasEditor, isInitialized]);

    // Separate cleanup effect
    useEffect(() => {
        return () => {
            if (canvasInstanceRef.current) {
                canvasInstanceRef.current.dispose();
                canvasInstanceRef.current = null;
                setCanvasEditor(null);
                setIsInitialized(false);
            }
        };
    }, [setCanvasEditor]);

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