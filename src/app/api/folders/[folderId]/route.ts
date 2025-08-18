import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest,{ params }: { params: Promise<{ folderId: string }> }) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
          { error: "User not authenticated." },
          { status: 401 }
      );
    }

    const { folderId } = await params;

    const existingUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!existingUser) {
      return NextResponse.json(
          { error: "User not exist in DB." },
          { status: 401 }
      ); 
    }

    const folder = await db.folder.findFirst({
      where: {
        id: folderId,
        userId: existingUser.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            _count: {
              select: {
                children: true,
                projects: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        projects: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
        _count: {
          select: {
            children: true,
            projects: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
          { error: "Folder not found." },
          { status: 404 }
      ); 
    }

    return NextResponse.json(folder, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
          error: (error as Error).message || "Unknown error occurred while adding project."
      },
      {
          status: 500
      }
    );
  }
}

// PATCH /api/folders/[folderId] - Update folder name or move to different parent
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
          { error: "User not authenticated." },
          { status: 401 }
      );
    }

    const { folderId } = await params;
    const body = await request.json();
    const { name, parentId } = body;

    // Get user from database
    const existingUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!existingUser) {
      return NextResponse.json(
          { error: "User not exist in DB." },
          { status: 401 }
      ); 
    }

    // Verify folder exists and belongs to user
    const existingFolder = await db.folder.findFirst({
      where: {
        id: folderId,
        userId: existingUser.id,
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
          { error: "Folder not found." },
          { status: 404 }
      ); 
    }

    // If moving to a new parent, verify it exists and prevent circular references
    if (parentId !== undefined) {
      if (parentId) {
        // Check if parent folder exists and belongs to user
        const parentFolder = await db.folder.findFirst({
          where: {
            id: parentId,
            userId: existingUser.id,
          },
        });

        if (!parentFolder) {
          return NextResponse.json(
              { error: "Parent folder not found." },
              { status: 404 }
          );
        }

        // Prevent moving folder into itself or its descendants
        if (await isDescendant(folderId, parentId)) {
          return NextResponse.json(
              { error: "Cannot move folder into itself or its descendants." },
              { status: 400 }
          );
        }
      }
    }

    // If changing name, check for duplicates in the target parent
    if (name && name !== existingFolder.name) {
      const targetParentId = parentId !== undefined ? parentId : existingFolder.parentId;
      
      const duplicateFolder = await db.folder.findFirst({
        where: {
          name,
          userId: existingUser.id,
          parentId: targetParentId,
          id: { not: folderId }, // Exclude current folder
        },
      });

      if (duplicateFolder) {
        return NextResponse.json(
          { error: "Folder with this name already exists." },
          { status: 409 }
        );
      }
    }

    // Update the folder
    const updateData: { name?: string; parentId?: string | null } = {};
    if (name) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId;

    const updatedFolder = await db.folder.update({
      where: { id: folderId },
      data: updateData,
      include: {
        _count: {
          select: {
            children: true,
            projects: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFolder, {status: 200});

  } catch (error) {
    console.error("[FOLDER_PATCH]", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Unknown error occurred while updating folder."
      },
      {
        status: 500
      }
    );
  }
}

// DELETE /api/folders/[folderId] - Delete a folder
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
          { error: "User not authenticated." },
          { status: 401 }
      );
    }

    const { folderId } = await params;

    // Get user from database
    const existingUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!existingUser) {
      return NextResponse.json(
          { error: "User not found." },
          { status: 404 }
      );
    }

    // Verify folder exists and belongs to user
    const folder = await db.folder.findFirst({
      where: {
        id: folderId,
        userId: existingUser.id,
      },
      include: {
        _count: {
          select: {
            children: true,
            projects: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found." },
        { status: 404 }
      );
    }

    // Check if folder has contents
    if (folder._count.children > 0 || folder._count.projects > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder with contents." },
        { status: 203 }
      );
    }

    // Delete the folder
    await db.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json("Folder deleted", { status: 200 });

  } catch (error) {
    console.error("[FOLDER_DELETE]", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Unknown error occurred while deleting folder."
      },
      {
        status: 500
      }
    );
  }
}

// Helper function to check if a folder is a descendant of another
async function isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  if (ancestorId === descendantId) {
    return true;
  }

  const folder = await db.folder.findUnique({
    where: { id: descendantId },
    select: { parentId: true },
  });

  if (!folder || !folder.parentId) {
    return false;
  }

  return isDescendant(ancestorId, folder.parentId);
}
