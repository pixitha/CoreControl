-- CreateTable
CREATE TABLE "server_history" (
    "id" SERIAL NOT NULL,
    "serverId" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "cpuUsage" TEXT,
    "ramUsage" TEXT,
    "diskUsage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_history_pkey" PRIMARY KEY ("id")
);
