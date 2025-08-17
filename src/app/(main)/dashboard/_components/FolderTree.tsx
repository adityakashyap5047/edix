"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Folder, FolderOpen, MoreHorizontal, Edit2, Trash2, FolderPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children?: Folder[];
  projectCount?: number;
}

interface FolderTreeProps {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderUpdate: () => void;
  onCreateFolder: (parentId: string | null) => void;
}

interface FolderItemProps {
  folder: Folder;
  level: number;
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderUpdate: () => void;
  onCreateFolder: (parentId: string | null) => void;
}

const FolderItem = ({ folder, level, currentFolderId, onFolderSelect, onFolderUpdate, onCreateFolder }: FolderItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSelected = currentFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      await axios.put(`/api/folders/${folder.id}`, {
        name: editName.trim(),
      });
      toast.success("Folder renamed successfully");
      setIsEditing(false);
      onFolderUpdate();
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast.error("Failed to rename folder");
    }
  };

  const handleDelete = async () => {
    if (hasChildren) {
      toast.error("Cannot delete folder with subfolders. Please delete or move subfolders first.");
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/api/folders/${folder.id}`);
      toast.success("Folder deleted successfully");
      onFolderUpdate();
      if (currentFolderId === folder.id) {
        onFolderSelect(folder.parentId);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(folder.name);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group ${
          isSelected
            ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
            : "hover:bg-slate-700/50 text-white/80 hover:text-white"
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-600 rounded"
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Folder Icon */}
        {!hasChildren && (
          <div className="p-1">
            <Folder className="h-4 w-4" />
          </div>
        )}

        {/* Folder Name */}
        <div
          className="flex-1 flex items-center gap-2"
          onClick={() => !isEditing && onFolderSelect(folder.id)}
        >
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <>
              <span className="flex-1 text-sm font-medium">{folder.name}</span>
              {folder.projectCount !== undefined && (
                <span className="text-xs text-white/50">({folder.projectCount})</span>
              )}
            </>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            <DropdownMenuItem
              onClick={() => onCreateFolder(folder.id)}
              className="text-white hover:bg-slate-700 cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsEditing(true)}
              className="text-white hover:bg-slate-700 cursor-pointer"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting || hasChildren}
              className="text-red-400 hover:bg-red-900/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onFolderSelect={onFolderSelect}
              onFolderUpdate={onFolderUpdate}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = ({ folders, currentFolderId, onFolderSelect, onFolderUpdate, onCreateFolder }: FolderTreeProps) => {
  return (
    <div className="space-y-1">
      {/* Root Level */}
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
          currentFolderId === null
            ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
            : "hover:bg-slate-700/50 text-white/80 hover:text-white"
        }`}
        onClick={() => onFolderSelect(null)}
      >
        <FolderOpen className="h-4 w-4" />
        <span className="text-sm font-medium">All Projects</span>
      </div>

      {/* Folder Tree */}
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          level={0}
          currentFolderId={currentFolderId}
          onFolderSelect={onFolderSelect}
          onFolderUpdate={onFolderUpdate}
          onCreateFolder={onCreateFolder}
        />
      ))}
    </div>
  );
};

export default FolderTree;
