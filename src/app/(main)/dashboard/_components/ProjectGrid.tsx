import { Project } from '@/types'
import { useRouter } from 'next/navigation'
import ProjectCard from './ProjectCard';

const ProjectGrid = ({projects, setProjects, setProjectCount}: {projects: Project[], setProjects: React.Dispatch<React.SetStateAction<Project[]>>, setProjectCount:React.Dispatch<React.SetStateAction<number>>}) => {

    const router = useRouter();

    const handleEdit = (projectId: string) => {
        router.push(`/editor/${projectId}`);
    }

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={() => handleEdit(project.id)}
                    setProjectCount={setProjectCount}
                    setProjects={setProjects}
                />
            ))}
        </div>
    )
}

export default ProjectGrid