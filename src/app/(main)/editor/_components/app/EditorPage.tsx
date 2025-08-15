"use client";

import { Project } from "@/types";
import TopBar from "./TobBar"
import EditorSideBar from "../EditorSideBar";
import Editor from "./Editor";

const EditorPage = ({project}: {project: Project}) => {
  return (
    <div className="flex flex-col h-screen">
        <TopBar project={project} />
        <div className="flex flex-1 overflow-hidden">
            <div className="hidden md:block">
              <EditorSideBar width={250} project={project} />
            </div>

            <div className="flex-1 bg-slate-800">
                <Editor project={project} />
            </div>
        </div>
    </div>
  )
}

export default EditorPage