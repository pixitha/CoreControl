-- CreateTable
CREATE TABLE "application" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "publicURL" TEXT NOT NULL,
    "localURL" TEXT,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);
