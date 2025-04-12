-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "uptime_checks" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
