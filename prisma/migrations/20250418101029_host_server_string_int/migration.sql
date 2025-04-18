/*
  Warnings:

  - The `hostServer` column on the `server` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "server" DROP COLUMN "hostServer",
ADD COLUMN     "hostServer" INTEGER;
