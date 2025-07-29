"use client";

import { CanvasContext } from "@/context/Context";
import { Project, ToolId } from "@/types";
import axios, { AxiosError } from "axios";
import { Loader2, Monitor } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RingLoader } from "react-spinners";
import { toast } from "sonner";
import CanvasEditor from "../_components/CanvasEditor";
import { Canvas } from "fabric";
import EditorTopBar from "../_components/EditorTopBar";
import EditorSideBar from "../_components/EditorSideBar";

const Page = () => {

    const params = useParams();
    const projId = params.projId;

    const [canvasEditor, setCanvasEditor] = useState<Canvas | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string | null>(null);

    const [activeTool, setActiveTool] = useState<ToolId>("resize");

    const [project, setProject] = useState<Project | null>(null);
    const [fetchingProject, setFetchingProject] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                {/* Top Bar  */}
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
    </CanvasContext.Provider>
}

export default Page