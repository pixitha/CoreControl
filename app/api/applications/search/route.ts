import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";

interface SearchRequest {
    searchterm: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: SearchRequest = await request.json();
        const { searchterm } = body;  
        
        const applications = await prisma.application.findMany({});

        const fuseOptions = {
            keys: ['name', 'description'],
            threshold: 0.3,
            includeScore: true,
        };

        const fuse = new Fuse(applications, fuseOptions);
        
        const searchResults = fuse.search(searchterm);

        const results = searchResults.map(({ item }) => item);

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}