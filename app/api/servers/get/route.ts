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
        
        const servers = await prisma.server.findMany({
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' }
        });

        const totalCount = await prisma.server.count();
        const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

        return NextResponse.json({ 
            servers,
            maxPage
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}