"use client";

import { Project } from "@/types";
import TopBar from "./TobBar"
import EditorSideBar from "../EditorSideBar";
import Editor from "./Editor";

const EditorPage = ({project}: {project: Project}) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
        {/* Top Bar  */}
        <TopBar project={project} />

        {/* Editor - Takes remaining height */}
        <div className="flex-1 bg-slate-800 overflow-hidden">
            <Editor project={project} />
        </div>
    </div>
  )
}

export default EditorPage