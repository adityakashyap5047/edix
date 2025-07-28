"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "./_components/EmptyState";
import NewProjectModal from "./_components/NewProjectModal";
import axios from "axios";
import { Project } from "@/types";
import ProjectGrid from "./_components/ProjectGrid";

const Page = () => {

    const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchProjects = async() => {
            setLoading(true);
            try {
                const response = await axios.get("/api/projects");
                setProjects(response.data.projects);
            } catch (error) {
                console.error(`Error Fetching projects ${error instanceof Error ? error.message : String(error)}`)
            } finally {
                setLoading(false);
            }
        }
        fetchProjects(); 
    }, []);

    return (
        <div className="min-h-main pt-32">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
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
                        <Plus className="h-5 w-5" />
                        New Project
                    </Button>
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

                <NewProjectModal
                    isOpen={showNewProjectModal}
                    onClose={() => setShowNewProjectModal(false)}
                    projects={projects}
                />
            </div>
        </div>
    )
}

export default Page