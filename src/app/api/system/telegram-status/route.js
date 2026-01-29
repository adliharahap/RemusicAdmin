import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        return NextResponse.json({ error: 'BOT_TOKEN missing' }, { status: 500 });
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
            next: { revalidate: 0 }
        });
        const data = await res.json();
        
        return NextResponse.json(data);
    } catch (error) {
        console.error("Telegram Status Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
