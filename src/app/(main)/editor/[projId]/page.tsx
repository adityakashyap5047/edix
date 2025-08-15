"use client";

import { CanvasContext } from "@/context/Context";
import { Project, ToolId } from "@/types";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RingLoader } from "react-spinners";
import { toast } from "sonner";
import CanvasEditor from "../_components/CanvasEditor";
import { Canvas } from "fabric";
import EditorTopBar from "../_components/EditorTopBar";
import EditorSideBar from "../_components/EditorSideBar";
import EditorPage from "../_components/app/EditorPage";

const Page = () => {

    const params = useParams();
    const projId = params.projId;

    const [canvasEditor, setCanvasEditor] = useState<Canvas | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string | null>(null);

    const [activeTool, setActiveTool] = useState<ToolId>("resize");
    const [isDesktop, setIsDesktop] = useState<boolean>(false);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    const [project, setProject] = useState<Project | null>(null);
    const [fetchingProject, setFetchingProject] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Track screen size to avoid canvas conflicts
    useEffect(() => {
        const checkScreenSize = () => {
            const wasDesktop = isDesktop;
            const nowDesktop = window.innerWidth >= 1024;
            
            if (wasDesktop !== nowDesktop) {
                // Screen size is changing, start transition
                setIsTransitioning(true);
                
                // Clear any existing canvas to prevent conflicts
                if (canvasEditor) {
                    try {
                        canvasEditor.dispose();
                    } catch (error) {
                        console.error('Error disposing canvas during transition:', error);
                    }
                    setCanvasEditor(null);
                }
                
                // Small delay to allow cleanup before switching
                setTimeout(() => {
                    setIsDesktop(nowDesktop);
                    setIsTransitioning(false);
                }, 100);
            } else {
                setIsDesktop(nowDesktop);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, [isDesktop, canvasEditor, setCanvasEditor]);

    useEffect(() => {
        const getProject = async () => {
            setFetchingProject(true);
            setError(null);
            try {
                const response = await axios.get(`/api/projects/${projId}`);
                setProject(response.data);
            } catch (error) {
                const axiosError = error as AxiosError<{ error?: string }>;
                console.error('Error while fetching project:', error);
                setError(axiosError.response?.data.error || "Unknown error occurred while fetching the project.");
                setProject(null);
                toast.error(axiosError.response?.data.error || "Unknown error occurred while fetching the project.");
            } finally {
                setFetchingProject(false);
            }
        };
        getProject();
    }, [projId])

    if (fetchingProject) {
        return (
            <div className="min-h-main bg-slate-900 flex justify-center items-center ">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <p className="text-white/70">Loading...</p>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
                Project Not Found
            </h1>
            <p className="text-white/70">
                {error || "The project you're looking for doesn't exist or you don't have access to it."}
            </p>
            </div>
        </div>
        );
    }

    return <CanvasContext.Provider value={{ 
        canvasEditor,
        setCanvasEditor,
        activeTool,
        onToolChange: setActiveTool,
        processingMessage,
        setProcessingMessage,
     }}>
        {isTransitioning ? (
            <div className="min-h-main bg-slate-900 flex items-center justify-center">
                <div className="text-white">Switching view...</div>
            </div>
        ) : !isDesktop ? (
            <div className="min-h-main bg-slate-900">
                <EditorPage project={project} />
            </div>
        ) : (
            <div className="min-h-main bg-slate-900">
                <div className="flex flex-col h-screen">
                    {processingMessage && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center">
                        <div className="rounded-lg p-6 flex flex-col items-center gap-4">
                            <RingLoader color="#fff" />
                            <div className="text-center">
                                <p className="text-white font-medium">{processingMessage}</p>
                                <p className="text-white/70 text-sm mt-1">
                                    Please wait, do not switch tabs or navigate away
                                </p>
                            </div>
                        </div>
                        </div>
                    )}
                    <EditorTopBar project={project} />

                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar  */}
                        <EditorSideBar project={project} />

                        <div className="flex-1 bg-slate-800">
                            <CanvasEditor project={project} />
                        </div>
                    </div>
                </div>
            </div>
        )}
    </CanvasContext.Provider>
}

export default Page