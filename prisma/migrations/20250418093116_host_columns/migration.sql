-- AlterTable
ALTER TABLE "server" ADD COLUMN     "host" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hostServer" TEXT;
