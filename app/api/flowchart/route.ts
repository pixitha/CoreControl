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
  draggable?: boolean;
  selectable?: boolean;
  zIndex?: number;
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
const APP_NODE_WIDTH = 160;
const APP_NODE_HEIGHT = 40;
const HORIZONTAL_SPACING = 280;
const VERTICAL_SPACING = 60;
const START_Y = 120;
const ROOT_NODE_WIDTH = 300;
const CONTAINER_PADDING = 40;

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

    // Root Node
    const rootNode: Node = {
      id: "root",
      type: "infrastructure",
      data: { label: "My Infrastructure" },
      position: { x: 0, y: 0 },
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

    // Server Nodes
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

    // Application Nodes
    const appNodes: Node[] = [];
    servers.forEach((server) => {
      const serverNode = serverNodes.find((n) => n.id === `server-${server.id}`);
      const serverX = serverNode?.position.x || 0;
      const xOffset = (NODE_WIDTH - APP_NODE_WIDTH) / 2;

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
              x: serverX + xOffset,
              y: START_Y + NODE_HEIGHT + 30 + appIndex * VERTICAL_SPACING,
            },
            style: {
              background: "#f5f5f5",
              color: "#0f0f0f",
              border: "2px solid #e6e4e1",
              borderRadius: "4px",
              padding: "6px",
              width: APP_NODE_WIDTH,
              height: APP_NODE_HEIGHT,
              fontSize: "0.8rem",
              lineHeight: "1.1",
              whiteSpace: "pre-wrap",
            },
          });
        });
    });

    // Connections
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

    // Container Box
    const allNodes = [rootNode, ...serverNodes, ...appNodes];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    allNodes.forEach((node) => {
      const width = parseInt(node.style.width?.toString() || "0", 10);
      const height = parseInt(node.style.height?.toString() || "0", 10);
      
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + width);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const containerNode: Node = {
      id: 'container',
      type: 'container',
      data: { label: '' },
      position: {
        x: minX - CONTAINER_PADDING,
        y: minY - CONTAINER_PADDING
      },
      style: {
        width: maxX - minX + 2 * CONTAINER_PADDING,
        height: maxY - minY + 2 * CONTAINER_PADDING,
        background: 'transparent',
        border: '2px dashed #e2e8f0',
        borderRadius: '8px',
        zIndex: 0,
      },
      draggable: false,
      selectable: false,
      zIndex: -1,
    };

    return NextResponse.json({
      nodes: [containerNode, ...allNodes],
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