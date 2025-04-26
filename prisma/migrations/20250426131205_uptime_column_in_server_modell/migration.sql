/*
  Warnings:

  - You are about to drop the column `ignoreNotFoundErr` on the `application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "application" DROP COLUMN "ignoreNotFoundErr";

-- AlterTable
ALTER TABLE "server" ADD COLUMN     "uptime" TEXT;
