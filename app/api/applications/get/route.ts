import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from '@/lib/generated/prisma'

interface GetRequest {
    page: number;
    ITEMS_PER_PAGE: number;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body: GetRequest = await request.json();
        const page = Math.max(1, body.page || 1);
        const ITEMS_PER_PAGE = body.ITEMS_PER_PAGE;
        
        const applications = await prisma.application.findMany({
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' }
        });

        const serverIds = applications
            .map(app => app.serverId)
            .filter((id): id is number => id !== null);

        const servers = await prisma.server.findMany({
            where: { 
                id: { 
                    in: serverIds 
                } 
            }
        });

        const servers_all = await prisma.server.findMany()

        const applicationsWithServers = applications.map(app => ({
            ...app,
            server: servers.find(s => s.id === app.serverId)?.name || 'No server'
        }));

        const totalCount = await prisma.application.count();
        const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

        return NextResponse.json({ 
            applications: applicationsWithServers,
            servers: servers_all,
            maxPage
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}