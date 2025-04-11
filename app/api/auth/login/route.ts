import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';

interface LoginRequest {
    username: string;
    password: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();
        const { username, password } = body;

        if(username !== process.env.LOGIN_USERNAME || password !== process.env.LOGIN_PASSWORD) {
            throw new Error('Invalid credentials');
        }
        
        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        
        // Create JWT
        const token = jwt.sign({ account_secret: process.env.ACCOUNT_SECRET }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({ token });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}