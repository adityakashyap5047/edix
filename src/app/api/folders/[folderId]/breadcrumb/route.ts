import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/folders/[folderId]/breadcrumb - Get folder breadcrumb path
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

    // Build breadcrumb path
    const breadcrumb = await buildBreadcrumb(folderId, user.id);

    if (!breadcrumb) {
      return new NextResponse("Folder not found", { status: 404 });
    }

    return NextResponse.json({ breadcrumb });

  } catch (error) {
    console.error("[FOLDER_BREADCRUMB]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Helper function to build breadcrumb path
async function buildBreadcrumb(folderId: string, userId: string): Promise<Array<{id: string, name: string}> | null> {
  const folder = await db.folder.findFirst({
    where: {
      id: folderId,
      userId: userId,
    },
  });

  if (!folder) {
    return null;
  }

  const breadcrumb = [{ id: folder.id, name: folder.name }];

  if (folder.parentId) {
    const parentBreadcrumb = await buildBreadcrumb(folder.parentId, userId);
    if (parentBreadcrumb) {
      return [...parentBreadcrumb, ...breadcrumb];
    }
  }

  return breadcrumb;
}
