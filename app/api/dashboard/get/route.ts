import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const serverCount = await prisma.server.count();

        const applicationCount = await prisma.application.count();

        const onlineApplicationsCount = await prisma.application.count({
            where: { online: true }
        });

        return NextResponse.json({
            serverCount,
            applicationCount,
            onlineApplicationsCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
