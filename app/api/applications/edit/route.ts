import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface EditRequest {
    id: number;
    name: string;
    description: string;
    icon: string;
    publicURL: string;
    localURL: string;
}

export async function PUT(request: NextRequest) {
    try {
        const body: EditRequest = await request.json();
        const { id, name, description, icon, publicURL, localURL } = body;

        const existingServer = await prisma.server.findUnique({ where: { id } });
        if (!existingServer) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { 
                name, 
                description,
                icon,
                publicURL,
                localURL
            }
        });

        return NextResponse.json({ message: "Application updated", application: updatedApplication });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}