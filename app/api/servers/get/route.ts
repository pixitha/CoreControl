import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface GetRequest {
    page?: number;
    ITEMS_PER_PAGE?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: GetRequest = await request.json();
        const page = Math.max(1, body.page || 1);
        const ITEMS_PER_PAGE = body.ITEMS_PER_PAGE || 4;

        const hosts = await prisma.server.findMany({
            where: { hostServer: 0 },
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' }
        });

        const hostsWithVms = await Promise.all(
            hosts.map(async (host) => ({
                ...host,
                hostedVMs: await prisma.server.findMany({
                    where: { hostServer: host.id },
                    orderBy: { name: 'asc' }
                })
            }))
        );

        const totalHosts = await prisma.server.count({
            where: { hostServer: null }
        });

        const maxPage = Math.ceil(totalHosts / ITEMS_PER_PAGE);

        return NextResponse.json({ 
            servers: hostsWithVms,
            maxPage
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}