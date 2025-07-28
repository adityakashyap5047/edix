import { createContext, useContext } from 'react';
import { Canvas } from 'fabric';

interface CanvasContextType {
    canvasEditor: Canvas | null;
    setCanvasEditor: (canvas: Canvas | null) => void;
    activeTool: string;
    onToolChange: (tool: string) => void;
    processingMessage: string | null;
    setProcessingMessage: (message: string | null) => void;
}

export const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {

    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error("Error occurred while fetching canvas context. Please try again.");
    }
    return context;

}