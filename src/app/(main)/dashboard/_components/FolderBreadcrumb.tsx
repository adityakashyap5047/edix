"use client";

import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface FolderBreadcrumbProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

const FolderBreadcrumb = ({ currentFolderId, onFolderSelect }: FolderBreadcrumbProps) => {
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentFolder = async () => {
      if (!currentFolderId) {
        setCurrentFolder(null);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`/api/folders/${currentFolderId}`);
        setCurrentFolder(response.data.folder);
      } catch (error) {
        console.error("Error fetching folder:", error);
        setCurrentFolder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentFolder();
  }, [currentFolderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-white/60 overflow-x-auto scrollbar-hide">
      <Home className="h-4 w-4 flex-shrink-0" />
      
      {/* Home */}
      <button
        onClick={() => onFolderSelect(null)}
        className={`text-sm transition-colors hover:text-white whitespace-nowrap ${
          !currentFolderId
            ? "text-blue-400 font-medium"
            : "text-white/60 hover:text-white"
        }`}
      >
        Home
      </button>

      {/* Current Folder */}
      {currentFolder && (
        <>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm text-blue-400 font-medium whitespace-nowrap max-w-[150px] sm:max-w-[200px] truncate" title={currentFolder.name}>
            {currentFolder.name}
          </span>
        </>
      )}
    </div>
  );
};

export default FolderBreadcrumb;
