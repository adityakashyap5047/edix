"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onFolderCreated: () => void;
}

const NewFolderModal = ({ isOpen, onClose, parentId, onFolderCreated }: NewFolderModalProps) => {
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = () => {
    if (!isCreating) {
      setFolderName("");
      onClose();
    }
  };

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setIsCreating(true);
    try {
      await axios.post("/api/folders", {
        name: folderName.trim(),
        parentId: parentId,
      });

      toast.success("Folder created successfully");
      setFolderName("");
      onFolderCreated();
      onClose();
    } catch (error: unknown) {
      console.error("Error creating folder:", error);
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
        ? error.response.data.error 
        : "Failed to create folder";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Create New Folder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="folderName" className="text-sm font-medium text-white/80">
              Folder Name
            </Label>
            <Input
              id="folderName"
              type="text"
              placeholder="Enter folder name..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-white/50 focus:border-blue-500"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {parentId && (
            <div className="text-sm text-white/60">
              This folder will be created inside the selected parent folder.
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={isCreating || !folderName.trim()}
              className="min-w-[100px]"
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderModal;
