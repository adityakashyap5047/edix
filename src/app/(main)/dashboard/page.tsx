"use client";

import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "./_components/EmptyState";
import NewProjectModal from "./_components/NewProjectModal";
import NewFolderModal from "./_components/NewFolderModal";
import FolderBreadcrumb from "./_components/FolderBreadcrumb";
import FolderGrid from "./_components/FolderGrid";
import axios from "axios";
import { Folder, Project } from "@/types";
import ProjectGrid from "./_components/ProjectGrid";

const Page = () => {

    const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [projectCount, setProjectCount] = useState<number>(0);

    const handleFolderSelect = (folderId: string | null) => {
        setCurrentFolderId(folderId);
    };

    useEffect(() => {
        const fetchData = async() => {
            setLoading(true);
            try {
                // Fetch projects and folders in parallel
                const [projectsResponse, foldersResponse] = await Promise.all([
                    axios.get("/api/projects", {
                        params: currentFolderId ? { folderId: currentFolderId } : {}
                    }),
                    axios.get("/api/folders", {
                        params: currentFolderId ? { parentId: currentFolderId } : { parentId: null }
                    })
                ]);
                setProjectCount(projectsResponse.data.projectCount);
                setProjects(projectsResponse.data.projects);
                setFolders(foldersResponse.data.folders);
            } catch (error) {
                console.error(`Error fetching data: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData(); 
    }, [currentFolderId]);

    const handleCreateFolder = (parentId: string | null) => {
        setNewFolderParentId(parentId);
        setShowNewFolderModal(true);
    };

    const handleFolderCreated = () => {
        // Refresh the data after folder creation
        const fetchData = async() => {
            try {
                // Fetch projects and folders in parallel
                const [projectsResponse, foldersResponse] = await Promise.all([
                    axios.get("/api/projects", {
                        params: currentFolderId ? { folderId: currentFolderId } : {}
                    }),
                    axios.get("/api/folders", {
                        params: currentFolderId ? { parentId: currentFolderId } : { parentId: null }
                    })
                ]);
                
                setProjects(projectsResponse.data.projects);
                setFolders(foldersResponse.data.folders);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    };

    return (
        <div className="min-h-main pt-32">
            <div className="container mx-auto px-6">
                {/* Breadcrumb with Folder Controls */}
                <div className="flex items-center justify-between mb-6">
                    <FolderBreadcrumb
                        currentFolderId={currentFolderId}
                        onFolderSelect={handleFolderSelect}
                    />
                    
                    {/* Folder Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => handleCreateFolder(currentFolderId)}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-white/60 hover:text-white hover:bg-slate-800"
                        >
                            <FolderPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">New Folder</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            Your Projects
                        </h1>
                        <p className="text-white/70" >
                            Create and manage your AI-powered image designs.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowNewProjectModal(true)}
                        variant="primary"
                        size="lg"
                        className="gap-2"
                        disabled={loading}
                    >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">New Project</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    </div>
                ) : (
                    <div>
                        {/* Folder Grid */}
                        <FolderGrid 
                            folders={folders}
                            onFolderSelect={handleFolderSelect}
                            setFolders={setFolders}
                        />
                        
                        {/* Project Grid */}
                        {projects && projects?.length > 0 ? (
                            <ProjectGrid projects={projects} setProjectCount={setProjectCount} setProjects={setProjects} />
                        ) : folders.length === 0 ? (
                            <EmptyState onCreateProject={() => setShowNewProjectModal(true)} />
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-white/60 mb-4">No projects in this folder yet</p>
                                <Button
                                    onClick={() => setShowNewProjectModal(true)}
                                    variant="primary"
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create First Project
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <NewProjectModal
                    isOpen={showNewProjectModal}
                    onClose={() => setShowNewProjectModal(false)}
                    projects={projects}
                    projectCount={projectCount}
                    folderId={currentFolderId}
                />

                <NewFolderModal
                    isOpen={showNewFolderModal}
                    onClose={() => setShowNewFolderModal(false)}
                    parentId={newFolderParentId}
                    onFolderCreated={handleFolderCreated}
                />
            </div>
        </div>
    )
}

export default Page