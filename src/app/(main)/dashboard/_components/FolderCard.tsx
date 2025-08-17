import axios from "axios";
import { Edit2, FolderIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FolderCardProps {
  folder: Folder;
  onFolderSelect: (folderId: string | null) => void;
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
}
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Folder } from "@/types";

interface FolderCardProps {
  folder: Folder;
  onFolderSelect: (folderId: string | null) => void;
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
}

const FolderCard = ({ folder, onFolderSelect, setFolders }: FolderCardProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(folder.name);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }
    setIsRenaming(true);
    const toastId = toast.loading("Renaming folder...");
    try {
      await axios.patch(`/api/folders/${folder.id}`, {
        name: editName.trim(),
      });
      
      // Immediately update the local state
      setFolders(prevFolders => 
        prevFolders.map(f => 
          f.id === folder.id 
            ? { ...f, name: editName.trim() }
            : f
        )
      );
      
      setIsEditing(false);
      toast.dismiss(toastId);
      toast.success("Folder renamed successfully");
      
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast.dismiss(toastId);
      toast.error("Failed to rename folder");
      // Reset the edit name to original on error
      setEditName(folder.name);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = () => {
    setDropdownOpen(false);
    setTimeout(() => {
      setDeleteDialogOpen(true);
    }, 100);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {   
      const response = await axios.delete(`/api/folders/${folder.id}`);
      if (response.status === 203) {
        toast.info("Cannot delete folder with contents");
        return;
      }
      
      setFolders(prevFolders => 
        prevFolders.filter(f => f.id !== folder.id)
      );
      
      toast.success("Folder deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting folder:", error);
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
        ? error.response.data.error 
        : "Failed to delete folder";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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
    <div className="py-2 px-3 sm:px-4 w-full flex items-center justify-between gap-2 sm:gap-4 bg-slate-800/50 border border-slate-700 rounded-sm hover:border-slate-600 transition-all duration-200 hover:bg-slate-800/70">
        <span><FolderIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" /></span>
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {isEditing ? (
                <input
                    type="text"
                    disabled={isRenaming}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                />
            ) : (
                <h3 
                    className="font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors text-xs sm:text-sm truncate flex-1"
                    onClick={() => {
                        onFolderSelect(folder.id);
                    }}
                    title={folder.name}
                >
                    {folder.name}
                </h3>
            )}

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 sm:p-2 h-auto flex-shrink-0"
                    >
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem
                        onClick={() => {
                            setIsEditing(true);
                            setDropdownOpen(false);
                        }}
                        className="text-white hover:bg-slate-700 cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                    </DropdownMenuItem>
                    <div className="px-2 py-1">
                        <Button
                            onClick={handleDeleteClick}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                            disabled={isDeleting}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-slate-800 text-white fixed top-[20vh] max-sm:top-[30vh]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete &quot;{folder.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button 
                        variant="glass" 
                        onClick={() => setDeleteDialogOpen(false)} 
                        disabled={isDeleting} 
                        className="hover:!bg-slate-900"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleDeleteConfirm} 
                        disabled={isDeleting} 
                        className="hover:!bg-red-400"
                    >
                        {isDeleting ? "Deleting..." : "Yes, Delete"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default FolderCard;