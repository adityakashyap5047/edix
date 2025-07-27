"use client";

import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/useFetch";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "./_components/EmptyState";
import NewProjectModal from "./_components/NewProjectModal";

const Page = () => {

    const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);

    const {
        data: projects,
        loading,
        error,
        fn: refetch
    } = useFetch({
        endpoint: "/api/projects",
    });

    useEffect(() => {
        refetch();
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
                    >
                        <Plus className="h-5 w-5" />
                        New Project
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    </div>
                // ) : projects && projects?.length > 0 ? (
                //     <ProjectGrid projects={projects} />
                ) : (
                    <EmptyState onCreateProject={() => setShowNewProjectModal(true)} />
                )}

                <NewProjectModal
                    isOpen={showNewProjectModal}
                    onClose={() => setShowNewProjectModal(false)}
                />
            </div>
        </div>
    )
}

export default Page