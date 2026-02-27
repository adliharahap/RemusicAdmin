import { Telegraf } from 'telegraf';
import { NextResponse } from 'next/server';

const botToken = process.env.BOT_TOKEN;

export async function POST(req) {
    if (!botToken) {
        return NextResponse.json({ error: 'BOT_TOKEN is not configured.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const bot = new Telegraf(botToken);
        
        // Memanggil Telegram API untuk mengubah Webhook URL
        const result = await bot.telegram.setWebhook(url);
        
        if (result) {
            return NextResponse.json({ success: true, message: `Webhook URL successfully set to ${url}`, url: url });
        } else {
             return NextResponse.json({ error: 'Failed to set Webhook URL' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error setting Telegram webhook:', error);
        return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 });
    }
}
