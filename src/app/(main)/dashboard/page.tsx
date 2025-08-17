"use client";

import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "./_components/EmptyState";
import NewProjectModal from "./_components/NewProjectModal";
import NewFolderModal from "./_components/NewFolderModal";
import FolderTree from "./_components/FolderTree";
import FolderBreadcrumb from "./_components/FolderBreadcrumb";
import axios from "axios";
import { Project } from "@/types";
import ProjectGrid from "./_components/ProjectGrid";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children?: Folder[];
  projectCount?: number;
}

const Page = () => {

    const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async() => {
            setLoading(true);
            try {
                // Fetch projects and folders in parallel
                const [projectsResponse, foldersResponse] = await Promise.all([
                    axios.get("/api/projects", {
                        params: currentFolderId ? { folderId: currentFolderId } : {}
                    }),
                    axios.get("/api/folders")
                ]);
                
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
        // Refresh folders after creation
        const fetchFolders = async () => {
            try {
                const response = await axios.get("/api/folders");
                setFolders(response.data.folders);
            } catch (error) {
                console.error("Error fetching folders:", error);
            }
        };
        fetchFolders();
    };

    const handleFolderUpdate = () => {
        // Refresh folders after update/delete
        handleFolderCreated();
    };

    return (
        <div className="min-h-main pt-32">
            <div className="container mx-auto px-6">
                <div className="flex gap-6">
                    {/* Sidebar with Folder Tree */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Folders</h2>
                                <Button
                                    onClick={() => handleCreateFolder(null)}
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 h-auto text-white/60 hover:text-white"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                </Button>
                            </div>
                            <FolderTree
                                folders={folders}
                                currentFolderId={currentFolderId}
                                onFolderSelect={setCurrentFolderId}
                                onFolderUpdate={handleFolderUpdate}
                                onCreateFolder={handleCreateFolder}
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <FolderBreadcrumb
                            currentFolderId={currentFolderId}
                            onFolderSelect={setCurrentFolderId}
                        />

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    {currentFolderId ? "Folder Projects" : "Your Projects"}
                                </h1>
                                <p className="text-white/70" >
                                    Create and manage your AI-powered image designs.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => handleCreateFolder(currentFolderId)}
                                    variant="outline"
                                    size="lg"
                                    className="gap-2 border-slate-600 text-white hover:bg-slate-800"
                                >
                                    <FolderPlus className="h-5 w-5" />
                                    New Folder
                                </Button>
                                <Button
                                    onClick={() => setShowNewProjectModal(true)}
                                    variant="primary"
                                    size="lg"
                                    className="gap-2"
                                    disabled={loading}
                                >
                                    <Plus className="h-5 w-5" />
                                    New Project
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                            </div>
                        ) : projects && projects?.length > 0 ? (
                            <ProjectGrid projects={projects} setProjects={setProjects} />
                        ) : (
                            <EmptyState onCreateProject={() => setShowNewProjectModal(true)} />
                        )}
                    </div>
                </div>

                <NewProjectModal
                    isOpen={showNewProjectModal}
                    onClose={() => setShowNewProjectModal(false)}
                    projects={projects}
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