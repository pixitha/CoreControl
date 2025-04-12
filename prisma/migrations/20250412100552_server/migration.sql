-- CreateTable
CREATE TABLE "server" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "os" TEXT,
    "ip" TEXT,
    "url" TEXT,

    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);
