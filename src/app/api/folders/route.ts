import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/folders - Get all folders for the authenticated user
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const parentId = url.searchParams.get("parentId") || null;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get folders and projects for the specified parent (or root level if parentId is null)
    const [folders, projects] = await Promise.all([
      db.folder.findMany({
        where: {
          userId: user.id,
          parentId: parentId,
        },
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
      }),
      db.project.findMany({
        where: {
          userId: user.id,
          folderId: parentId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    return NextResponse.json({
      folders,
      projects,
    });

  } catch (error) {
    console.error("[FOLDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/folders - Create a new folder
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, parentId } = body;

    if (!name || typeof name !== 'string') {
      return new NextResponse("Folder name is required", { status: 400 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // If parentId is provided, verify the parent folder exists and belongs to the user
    if (parentId) {
      const parentFolder = await db.folder.findFirst({
        where: {
          id: parentId,
          userId: user.id,
        },
      });

      if (!parentFolder) {
        return new NextResponse("Parent folder not found", { status: 404 });
      }
    }

    // Check if folder with same name already exists in the same parent
    const existingFolder = await db.folder.findFirst({
      where: {
        name,
        userId: user.id,
        parentId: parentId || null,
      },
    });

    if (existingFolder) {
      return new NextResponse("Folder with this name already exists", { status: 409 });
    }

    // Create the folder
    const folder = await db.folder.create({
      data: {
        name,
        userId: user.id,
        parentId: parentId || null,
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

    return NextResponse.json(folder);

  } catch (error) {
    console.error("[FOLDERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
