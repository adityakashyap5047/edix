"use client";

import { Project } from "@/types";
import TopBar from "./TobBar"
import EditorSideBar from "../EditorSideBar";
import Editor from "./Editor";
import { useEffect, useState } from "react";

const EditorPage = ({project}: {project: Project}) => {
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [screenHeight, setScreenHeight] = useState<number>(0);

  useEffect(() => {
    // Set initial screen dimensions
    setScreenWidth(window.innerWidth);
    setScreenHeight(window.innerHeight);
    
    // Handle resize and orientation change
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Handle mobile browser UI changes (address bar hiding/showing)
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setScreenHeight(window.visualViewport.height);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  // Use dynamic height for mobile, h-screen for desktop
  const containerStyle = screenWidth < 1024 ? { 
    height: `${screenHeight}px`,
    maxHeight: `${screenHeight}px`
  } : {};

  return (
    <div 
      className={`flex flex-col ${screenWidth >= 1024 ? 'h-screen' : ''} overflow-hidden`}
      style={{
        ...containerStyle,
        // Ensure full viewport usage on mobile
        minHeight: screenWidth < 1024 ? `${screenHeight}px` : '100vh'
      }}
    >
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
                        height: Math.min(screenHeight * 0.35, 280), // 35% of available height, max 280px
                        maxHeight: '280px' // Maximum height limit
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