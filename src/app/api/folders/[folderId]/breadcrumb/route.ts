import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/folders/[folderId]/breadcrumb - Get folder breadcrumb path
export async function GET(req: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
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
          { error: "User not exist in DB." },
          { status: 401 }
      ); 
    }

    // Build breadcrumb path
    const breadcrumb = await buildBreadcrumb(folderId, existingUser.id);
    if (!breadcrumb) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      ); 
    }

    return NextResponse.json({ breadcrumb }, { status: 200 });

  } catch (error: unknown) {
      return NextResponse.json(
          {
              error: (error as Error).message || "Unknown error occurred while building Breadcrumb."
          },
          {
              status: 500
          }
      );
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
