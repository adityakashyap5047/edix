import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(){
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

        if (existingUser) {
            return NextResponse.json(existingUser, {
                status: 200
            });
        }

        const name = `${user?.firstName} ${user?.lastName}`;

        const newUser = await db?.user.create({
            data: {
                clerkUserId: user?.id,
                name: name,
                email: user?.emailAddresses[0]?.emailAddress || "",
                imageUrl: user?.imageUrl || "",
            },
        });

        return NextResponse.json(newUser, {
            status: 201
        });
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: (error as Error).message || "Unknown error occurred while adding user."
            },
            {
                status: 500
            }
        );
    }
}