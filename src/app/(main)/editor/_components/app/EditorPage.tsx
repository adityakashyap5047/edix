"use client";

import { Project } from "@/types";
import TopBar from "./TobBar"

const EditorPage = ({project}: {project: Project}) => {
  return (
    <div>
        <TopBar project={project} />
    </div>
  )
}

export default EditorPage