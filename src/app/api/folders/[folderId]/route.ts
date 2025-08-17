import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/folders/[folderId] - Get a specific folder with its contents
export async function GET(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { folderId } = params;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get the folder with its contents
    const folder = await db.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
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
      return new NextResponse("Folder not found", { status: 404 });
    }

    return NextResponse.json(folder);

  } catch (error) {
    console.error("[FOLDER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/folders/[folderId] - Update folder name or move to different parent
export async function PATCH(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { folderId } = params;
    const body = await req.json();
    const { name, parentId } = body;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify folder exists and belongs to user
    const existingFolder = await db.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
    });

    if (!existingFolder) {
      return new NextResponse("Folder not found", { status: 404 });
    }

    // If moving to a new parent, verify it exists and prevent circular references
    if (parentId !== undefined) {
      if (parentId) {
        // Check if parent folder exists and belongs to user
        const parentFolder = await db.folder.findFirst({
          where: {
            id: parentId,
            userId: user.id,
          },
        });

        if (!parentFolder) {
          return new NextResponse("Parent folder not found", { status: 404 });
        }

        // Prevent moving folder into itself or its descendants
        if (await isDescendant(folderId, parentId)) {
          return new NextResponse("Cannot move folder into itself or its descendants", { status: 400 });
        }
      }
    }

    // If changing name, check for duplicates in the target parent
    if (name && name !== existingFolder.name) {
      const targetParentId = parentId !== undefined ? parentId : existingFolder.parentId;
      
      const duplicateFolder = await db.folder.findFirst({
        where: {
          name,
          userId: user.id,
          parentId: targetParentId,
          id: { not: folderId }, // Exclude current folder
        },
      });

      if (duplicateFolder) {
        return new NextResponse("Folder with this name already exists", { status: 409 });
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

    return NextResponse.json(updatedFolder);

  } catch (error) {
    console.error("[FOLDER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/folders/[folderId] - Delete a folder
export async function DELETE(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { folderId } = params;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify folder exists and belongs to user
    const folder = await db.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
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
      return new NextResponse("Folder not found", { status: 404 });
    }

    // Check if folder has contents
    if (folder._count.children > 0 || folder._count.projects > 0) {
      return new NextResponse("Cannot delete folder with contents", { status: 400 });
    }

    // Delete the folder
    await db.folder.delete({
      where: { id: folderId },
    });

    return new NextResponse("Folder deleted", { status: 200 });

  } catch (error) {
    console.error("[FOLDER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
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
