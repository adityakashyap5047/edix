import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Imagekit from "imagekit";
import axios from "axios";

const imagekit = new Imagekit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
})

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

export async function GET(request: NextRequest) {

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

        // Get folderId from search parameters
        const { searchParams } = new URL(request.url);
        const folderId = searchParams.get('folderId');

        // Build where clause based on folderId parameter
        const whereClause = {
            userId: existingUser.id,
            ...(folderId ? { folderId: folderId } : { folderId: null })
        };

        // Fetch projects filtered by folder
        const projects = await db.project.findMany({
            where: whereClause,
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(
            { projects },
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
        const options = {
            method: 'GET',
            url: 'https://api.imagekit.io/v1/files',
            params: {type: 'file', path: 'edix/projects', fileType: 'image'},
            headers: {
                Accept: 'application/json',
                Authorization: `Basic ${process.env.IMAGEKIT_TOKEN}`
            }
        };

        const { data: files } = await axios.request(options);
        const { fileId } = files?.find((file: {url: string, fileId: string}) => file.url.split("?")[0] === project.originalImageUrl);

        await imagekit.deleteFile(fileId);

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