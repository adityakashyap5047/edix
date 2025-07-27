import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest){

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

        const projectData = await request.json();

        if (existingUser.plan === 'FREE') {
            const projectCount = existingUser.projectsUsed;

            if (projectCount >= 3) {
                return NextResponse.json(
                    { error: "Free plan limited to 3 projects. Upgrade to Pro for unlimited projects."},
                    { status: 402 }
                )
            }
        }

        const newProject = await db?.project.create({
            data: {
                ...projectData,
                userId: existingUser.id,
            },
        });

        await db?.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                projectsUsed: existingUser.projectsUsed + 1,
            },
        });

        return NextResponse.json(
            { message: "Project added successfully.", project: newProject },
            { status: 201 }
        );
    } catch (error: unknown) {
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

export async function GET() {

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
            include: {
                projects: true,
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not exist in DB." },
                { status: 401 }
            ); 
        }

        return NextResponse.json(
            { projects: existingUser.projects },
            { status: 200 }
        );
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: (error as Error).message || "Unknown error occurred while fetching projects."
            },
            {
                status: 500
            }
        );
    }

}

export async function DELETE(request: NextRequest) {
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

        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required." },
                { status: 400 }
            );
        }

        const project = await db?.project.findUnique({
            where: {
                id: projectId,
            }
        });

        if (!project) {
            return NextResponse.json(
                {error: "Project Not Found"},
                {status: 404}
            )
        }

        const deletedProject = await db?.project.delete({
            where: {
                id: projectId,
            },
        });

        await db?.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                projectsUsed: existingUser.projectsUsed - 1,
            },
        });

        return NextResponse.json(
            { message: "Project deleted successfully.", project: deletedProject },
            { status: 200 }
        );
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: (error as Error).message || "Unknown error occurred while deleting project."
            },
            {
                status: 500
            }
        );
    }
}