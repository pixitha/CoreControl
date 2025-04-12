import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from '@/lib/generated/prisma'

interface GetRequest {
    page: number;
}

const prisma = new PrismaClient();
const ITEMS_PER_PAGE = 5; 

export async function POST(request: NextRequest) {
    try {
        const body: GetRequest = await request.json();
        const page = Math.max(1, body.page || 1);
        
        const applications = await prisma.application.findMany({
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' }
        });

        const totalCount = await prisma.application.count();
        const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

        return NextResponse.json({ 
            applications,
            maxPage
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}