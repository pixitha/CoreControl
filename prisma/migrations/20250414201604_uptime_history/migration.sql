-- CreateTable
CREATE TABLE "uptime_history" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uptime_history_pkey" PRIMARY KEY ("id")
);
