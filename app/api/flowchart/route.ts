import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    [key: string]: any;
  };
  position: { x: number; y: number };
  style: React.CSSProperties;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  style: {
    stroke: string;
    strokeWidth: number;
  };
}

interface Server {
  id: number;
  name: string;
  ip: string;
}

interface Application {
  id: number;
  name: string;
  localURL: string;
  serverId: number;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 280;
const VERTICAL_SPACING = 80;
const START_Y = 120;
const ROOT_NODE_WIDTH = 300;

export async function GET() {
  try {
    const [servers, applications] = await Promise.all([
      prisma.server.findMany({
        orderBy: { id: "asc" },
      }) as Promise<Server[]>,
      prisma.application.findMany({
        orderBy: { serverId: "asc" },
      }) as Promise<Application[]>,
    ]);

    const rootNode: Node = {
      id: "root",
      type: "infrastructure",
      data: { label: "My Infrastructure" },
      position: { x: 0, y: 20 },
      style: {
        background: "#ffffff",
        color: "#0f0f0f",
        border: "2px solid #e6e4e1",
        borderRadius: "8px",
        padding: "16px",
        width: ROOT_NODE_WIDTH,
        height: NODE_HEIGHT,
        fontSize: "1.2rem",
        fontWeight: "bold",
      },
    };

    const serverNodes: Node[] = servers.map((server, index) => {
      const xPos =
        index * HORIZONTAL_SPACING -
        ((servers.length - 1) * HORIZONTAL_SPACING) / 2;

      return {
        id: `server-${server.id}`,
        type: "server",
        data: {
          label: `${server.name}\n${server.ip}`,
          ...server,
        },
        position: { x: xPos, y: START_Y },
        style: {
          background: "#ffffff",
          color: "#0f0f0f",
          border: "2px solid #e6e4e1",
          borderRadius: "4px",
          padding: "8px",
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          fontSize: "0.9rem",
          lineHeight: "1.2",
          whiteSpace: "pre-wrap",
        },
      };
    });

    const appNodes: Node[] = [];
    servers.forEach((server) => {
      const serverX =
        serverNodes.find((n) => n.id === `server-${server.id}`)?.position.x || 0;
      const serverY = START_Y;

      applications
        .filter((app) => app.serverId === server.id)
        .forEach((app, appIndex) => {
          appNodes.push({
            id: `app-${app.id}`,
            type: "application",
            data: {
              label: `${app.name}\n${app.localURL}`,
              ...app,
            },
            position: {
              x: serverX,
              y: serverY + NODE_HEIGHT + 40 + appIndex * VERTICAL_SPACING,
            },
            style: {
              background: "#ffffff",
              color: "#0f0f0f",
              border: "2px solid #e6e4e1",
              borderRadius: "4px",
              padding: "8px",
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
              fontSize: "0.9rem",
              lineHeight: "1.2",
              whiteSpace: "pre-wrap",
            },
          });
        });
    });

    const connections: Edge[] = [
      ...servers.map((server) => ({
        id: `conn-root-${server.id}`,
        source: "root",
        target: `server-${server.id}`,
        type: "straight",
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      })),
      ...applications.map((app) => ({
        id: `conn-${app.serverId}-${app.id}`,
        source: `server-${app.serverId}`,
        target: `app-${app.id}`,
        type: "straight",
        style: {
          stroke: "#60a5fa",
          strokeWidth: 2,
        },
      })),
    ];

    return NextResponse.json({
      nodes: [rootNode, ...serverNodes, ...appNodes],
      edges: connections,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Error fetching flowchart: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}