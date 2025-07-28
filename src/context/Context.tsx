import { createContext, useContext } from 'react';

export const CanvasContext = createContext({});

export const useCanvas = () => {

    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error("Error occurred while fetching canvas context. Please try again.");
    }
    return context;

}