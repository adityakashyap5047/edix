import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ projId: string }> }) {
    try {

        const user = await currentUser();
                
        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated." },
                { status: 401 }
            );
        }

        const existingUser = await db?.user.findUnique({
            where: {
                clerkUserId: user?.id
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not exist in DB." },
                { status: 401 }
            ); 
        }

        const { projId } = await params;

        const project = await db?.project.findUnique({
            where: {
                id: projId,
                userId: existingUser.id,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(project, {
            status: 200
        });
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: (error as Error).message || "Unknown error occurred while fetching project."
            },
            {
                status: 500
            }
        );
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ projId: string }> }) {
    try {
        const user = await currentUser();
                
        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated." },
                { status: 401 }
            );
        }

        const existingUser = await db?.user.findUnique({
            where: {
                clerkUserId: user?.id
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not exist in DB." },
                { status: 401 }
            ); 
        }

        const { projId } = await params;

        const project = await db?.project.findUnique({
            where: {
                id: projId,
                userId: existingUser.id,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found." },
                { status: 404 }
            );
        }

        const projectData = await request.json();
        console.log("Updating project with data:", projectData);

        const updatedProject = await db?.project.update({
            where: {
                id: projId,
                userId: existingUser.id,
            }, data: {
                ...projectData
            }
        });

        return NextResponse.json({ message: "Project updated successfully.", project: updatedProject }, {
            status: 200
        });
        
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: (error as Error).message || "Unknown error occurred while updating project."
            },
            {
                status: 500
            }
        );
    }
}