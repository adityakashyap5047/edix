"use client";
import { Folder } from "@/types";
import FolderCard from "./FolderCard";

interface FolderGridProps {
  folders: Folder[];
  onFolderSelect: (folderId: string | null) => void;
  onFolderUpdate: () => void;
}

const FolderGrid = ({ folders, onFolderSelect, onFolderUpdate }: FolderGridProps) => {
  if (!folders || folders.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Folders</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onFolderSelect={onFolderSelect}
            onFolderUpdate={onFolderUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderGrid;
