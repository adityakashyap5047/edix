"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import React, { useState } from "react";

interface DeleteConfirmDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  variant?: "glass" | "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | "primary"
}

export function DeleteConfirmDialog({
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the project.",
  onConfirm,
  loading,
  variant="glass"
}: DeleteConfirmDialogProps) {

    const [open, setOpen] = useState<boolean>(false);
    
    const handleDialogClose = () => {
        if (!loading) {
            setOpen(false);
        }
    };
    
    const handleOpenChange = (newOpen: boolean) => {
        if (!loading) {
            setOpen(newOpen);
        }
    };

    const handleConfirm = async () => {
        await onConfirm();
        setOpen(false);
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} variant={variant} size={"sm"} className={`gap-2 text-red-400 hover:text-red-300 cursor-pointer`} disabled={loading}>
                <Trash2 className="h-4 w-4" />
                Delete
            </Button>
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="bg-slate-800 text-white fixed top-[20vh] max-sm:top-[30vh]">
                <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <Button variant="glass" onClick={handleDialogClose} disabled={loading} className="hover:!bg-slate-900">
                    Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirm} disabled={loading} className="hover:!bg-red-400">
                    {loading ? "Deleting..." : "Yes, Delete"}
                </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
