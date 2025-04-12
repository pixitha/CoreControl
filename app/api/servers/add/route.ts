import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from '@/lib/generated/prisma'

interface AddRequest {
    name: string;
    os: string;
    ip: string;
    url: string;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { name, os, ip, url } = body;  
        
        const server = await prisma.server.create({
            data: {
                name,
                os,
                ip,
                url,
            }
        });

        return NextResponse.json({ message: "Success", server });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
