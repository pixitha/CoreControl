/*
  Warnings:

  - You are about to drop the column `notification_text` on the `settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "settings" DROP COLUMN "notification_text",
ADD COLUMN     "notification_text_application" TEXT,
ADD COLUMN     "notification_text_server" TEXT;
