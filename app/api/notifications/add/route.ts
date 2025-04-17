import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    type: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpFrom?: string;
    smtpTo?: string;
    telegramToken?: string;
    telegramChatId?: string;
    discordWebhook?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { type, smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, smtpFrom, smtpTo, telegramToken, telegramChatId, discordWebhook } = body; 
        
        const notification = await prisma.notification.create({
            data: {
                type: type,
                smtpHost: smtpHost,
                smtpPort: smtpPort,
                smtpFrom: smtpFrom,
                smtpUser: smtpUsername,
                smtpPass: smtpPassword,
                smtpSecure: smtpSecure,
                smtpTo: smtpTo,
                telegramChatId: telegramChatId,
                telegramToken: telegramToken,
                discordWebhook: discordWebhook,
            }
        });

        return NextResponse.json({ message: "Success", notification });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
