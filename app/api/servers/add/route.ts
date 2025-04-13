import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    name: string;
    os: string;
    ip: string;
    url: string;
    cpu: string;
    gpu: string;
    ram: string;
    disk: string;

}

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { name, os, ip, url, cpu, gpu, ram, disk } = body;  
        
        const server = await prisma.server.create({
            data: {
                name,
                os,
                ip,
                url,
                cpu,
                gpu,
                ram,
                disk
            }
        });

        return NextResponse.json({ message: "Success", server });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
