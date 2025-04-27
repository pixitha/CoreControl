/*
  Warnings:

  - Added the required column `name` to the `notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "application" ADD COLUMN     "uptimecheckUrl" TEXT;

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "name" TEXT NOT NULL;
