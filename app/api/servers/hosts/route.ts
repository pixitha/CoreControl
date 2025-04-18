import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const servers = await prisma.server.findMany({
            where: { host: true },
        });
        return NextResponse.json({ servers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}