-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpFrom" TEXT,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpSecure" BOOLEAN,
    "smtpTo" TEXT,
    "telegramChatId" TEXT,
    "telegramToken" TEXT,
    "discordWebhook" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);
