"use client";

import { CanvasContext } from "@/context/Context";
import axios from "axios";
import { Monitor } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {

    const params = useParams();
    const projId = params.projId;

    const [canvasEditor, setCanvasEditor] = useState(null);
    const [processingMessage, setProcessingMessage] = useState<string | null>(null);

    const [activeTool, setActiveTool] = useState<string>("resize");

    useEffect(() => {
        const getProject = async () => {
            const response = await axios.get(`/api/projects/${projId}`);
            console.log("Project data:", response.data);
        }
        getProject();
    }, [projId])

    return <CanvasContext.Provider value={{ 
        canvasEditor,
        setCanvasEditor,
        activeTool,
        onToolChange: setActiveTool,
        processingMessage,
        setProcessingMessage,
     }}>
        <div className="lg:hidden min-h-main bg-slate-900 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <Monitor className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-4">
                    Desktop Required
                </h1>
                <p className="text-white/70 text-lg mb-2">
                    This editor is only usable on desktop.
                </p>
                <p className="text-white/50 text-sm">
                    Please use a larger screen to access the full editing experience.
                </p>
            </div>
        </div>
        <div className="hidden lg:block min-h-main bg-slate-900">
            Editor: {projId}
        </div>
    </CanvasContext.Provider>
}

export default Page