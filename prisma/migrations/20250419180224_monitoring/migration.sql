-- AlterTable
ALTER TABLE "server" ADD COLUMN     "cpuUsage" TEXT,
ADD COLUMN     "diskUsage" TEXT,
ADD COLUMN     "monitoring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monitoringURL" TEXT,
ADD COLUMN     "online" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ramUsage" TEXT;
