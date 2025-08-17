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
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBreadcrumbs = async () => {
      if (!currentFolderId) {
        setBreadcrumbs([{ id: null, name: "Home" }]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`/api/folders/${currentFolderId}/breadcrumb`);
        const breadcrumbPath = response.data.breadcrumb;
        
        // Create breadcrumb items starting with Home
        const breadcrumbItems: BreadcrumbItem[] = [
          { id: null, name: "Home" },
          ...breadcrumbPath.map((folder: { id: string; name: string }) => ({
            id: folder.id,
            name: folder.name,
          })),
        ];
        
        setBreadcrumbs(breadcrumbItems);
      } catch (error) {
        console.error("Error fetching breadcrumbs:", error);
        setBreadcrumbs([{ id: null, name: "Home" }]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreadcrumbs();
  }, [currentFolderId]);

  // if (loading) {
  //   return (
  //     <div className="flex items-center gap-2 text-white/60">
  //       
  //       <span className="text-sm">Loading...</span>
  //     </div>
  //   );
  // }

  return (
    <div className="flex items-center gap-2 text-white/60 overflow-x-auto scrollbar-hide">
      <Home className="h-4 w-4 flex-shrink-0" />
      {breadcrumbs.map((item, index) => (
        <div key={item.id || "root"} className="flex items-center gap-2 flex-shrink-0">
          {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          
          <button
            onClick={() => onFolderSelect(item.id)}
            className={`text-sm transition-colors hover:text-white whitespace-nowrap max-w-[150px] sm:max-w-[200px] truncate ${
              index === breadcrumbs.length - 1
                ? "text-blue-400 font-medium"
                : "text-white/60 hover:text-white"
            }`}
            title={item.name}
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );
};

export default FolderBreadcrumb;
