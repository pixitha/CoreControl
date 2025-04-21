import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      select: {
        id: true,
        online: true,
        cpuUsage: true,
        ramUsage: true,
        diskUsage: true,
      }
    });

    const monitoringData = servers.map((server: {
      id: number;
      online: boolean;
      cpuUsage: string | null;
      ramUsage: string | null;
      diskUsage: string | null;
    }) => ({
      id: server.id,
      online: server.online,
      cpuUsage: server.cpuUsage ? parseInt(server.cpuUsage) : 0,
      ramUsage: server.ramUsage ? parseInt(server.ramUsage) : 0,
      diskUsage: server.diskUsage ? parseInt(server.diskUsage) : 0
    }));

    return NextResponse.json(monitoringData)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
} 