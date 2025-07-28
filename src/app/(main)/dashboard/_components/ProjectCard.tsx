"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Project } from "@/types"
import axios, { AxiosError } from "axios";
import { Edit } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/DeleteDialog";

const ProjectCard = ({ project, onEdit, setProjects }: { project: Project, onEdit: () => void, setProjects: React.Dispatch<React.SetStateAction<Project[]>> }) => {

    const [loading, setLoading] = useState<boolean>(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await axios.delete(`/api/projects`, { data: { projectId: project.id } });
            await axios.get("/api/projects"); 
            toast.success(response.data.message || "Project deleted successfully.");
            setProjects((prev: Project[]) => prev.filter((p: Project) => p.id !== project.id));
        } catch (error) {
            const axiosError = error as AxiosError<{ error?: string }>;
            console.error('Error deleting project:', error);
            toast.error(axiosError.response?.data.error || "Unknown error occurred while deleting the project.");
            throw error; // Re-throw to let DeleteDialog know it failed
        } finally {
            setLoading(false);
        }
    };
    const lastUpdated = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });

  return (
    <Card className={`py-0 group relative bg-slate-800/50 overflow-hidden hover:border-white/20 transition-all hover:transform hover:scale-[1.02]`}>
        <div className="aspect-video bg-slate-900 relative overflow-hidden">
            {project.thumbnailUrl && (
                <Image
                    src={project.thumbnailUrl}
                    alt={project.title}
                    width={300}
                    height={200}
                    className="w-full h-full object-cover"
                />
            )}

            <div className=" absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant={"glass"} size={"sm"} disabled={loading} onClick={onEdit} className={`gap-2 cursor-pointer`}>
                    <Edit className="h-4 w-4" />
                    Edit
                </Button>

                <DeleteConfirmDialog
                    onConfirm={handleDelete}
                    loading={loading}
                    title={`Are you sure you want to delete "${project.title}"?`}
                    description="This action cannot be undone."
                    setLoading={setLoading}
                />
            </div>
        </div>
        <CardContent className="pb-6">
            <h3 className="font-semibold text-white mb-1 truncate">
                {project.title}
            </h3>

            <div className="flex items-center justify-between text-sm text-white/70">
                <span>Updated {lastUpdated}</span>
                <Badge
                    variant="secondary"
                    className="text-xs bg-slate-700 text-white/70"
                >
                    {project.width} x {project.height}
                </Badge>
            </div>
        </CardContent>
    </Card>
  )
}

export default ProjectCard