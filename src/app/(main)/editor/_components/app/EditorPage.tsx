"use client";

import { Project } from "@/types";
import TopBar from "./TobBar"
import EditorSideBar from "../EditorSideBar";
import Editor from "./Editor";
import { useEffect, useState } from "react";

const EditorPage = ({project}: {project: Project}) => {
  const [screenWidth, setScreenWidth] = useState<number>(0);

  useEffect(() => {
    // Set initial screen width
    setScreenWidth(window.innerWidth);
    
    // Handle resize
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <TopBar project={project} />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
          {/* Side EditorSideBar - visible only above 610px */}
          {screenWidth > 610 && (
            <div className="flex-shrink-0 overflow-y-auto" style={{scrollbarWidth: "none"}}>
              <EditorSideBar width={250} project={project} />
            </div>
          )}

          {/* Editor area */}
          <div className="flex-1 bg-slate-800 flex flex-col">
              {/* Canvas Editor takes available space */}
              <div className="flex-1">
                  <Editor project={project} />
              </div>
              
              {/* Bottom EditorSideBar - visible only up to 610px */}
              {screenWidth <= 610 && (
                <div 
                    className="bg-slate-900 border-t overflow-y-auto"
                    style={{ 
                        height: '40vh', // 40% of viewport height
                        maxHeight: '300px' // Maximum height limit
                    }}
                >
                    <EditorSideBar width={screenWidth} project={project} />
                </div>
              )}
          </div>
      </div>
    </div>
  )
}

export default EditorPage