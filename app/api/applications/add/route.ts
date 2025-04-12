import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from '@/lib/generated/prisma'

interface AddRequest {
    serverId: number;
    name: string;
    description: string;
    icon: string;
    publicURL: string;
    localURL: string;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { serverId, name, description, icon, publicURL, localURL } = body;  
        
        const application = await prisma.application.create({
            data: {
                serverId,
                name,
                description,
                icon,
                publicURL,
                localURL
            }
        });

        return NextResponse.json({ message: "Success", application });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
