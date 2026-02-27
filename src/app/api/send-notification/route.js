import admin from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { title, message, tokens, topic, data, imageUrl } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        // Siapkan Payload Notifikasi
        const payload = {
            notification: {
                title: title,
                body: message,
                ...(imageUrl && { image: imageUrl }),
            },
            data: data || {}, // Data tambahan opsional (misal: requestId, type)
            // Tambahkan konfigurasi khusus Android (misal prioritas tinggi agar masuk lockscreen)
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'remusic_important' // Sesuakan dengan konfigurasi channel FCM di Kotlin-mu
                }
            }
        };

        let response;

        // Mode 1: Kirim ke Topic (Broadcast ke semua user yang subscribe 'all')
        if (topic) {
            const topicPayload = {
                topic: topic,
                notification: {
                    title: title,
                    body: message,
                    ...(imageUrl && { image: imageUrl }),
                },
                data: data || {},
                android: {
                    priority: 'high',
                },
            };
            response = await admin.messaging().send(topicPayload);
            return NextResponse.json({ success: true, type: 'topic', response });
        }

        // Mode 2: Kirim ke Spesifik User(s) via Token
        if (tokens && tokens.length > 0) {
            // Gunakan sendMulticast untuk efisiensi pengiriman masal ke array token (maks 500 token)
            // Mengubah format payload karena sendMulticast meminta object format V1 (Messaging API v1)
            const multicastPayload = {
                tokens: tokens,
                notification: {
                    title: title,
                    body: message,
                    ...(imageUrl && { image: imageUrl }),
                },
                data: data || {},
                android: {
                    priority: 'high',
                },
            };
            
            response = await admin.messaging().sendEachForMulticast(multicastPayload);
            
            // Evaluasi pengiriman (Beberapa token mungkin sudah kedaluwarsa/invalid)
            const failedTokens = [];
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                console.warn('FCM Failure: Ada token yang gagal dikirim:', failedTokens);
            }

            return NextResponse.json({ 
                success: true, 
                type: 'multicast', 
                successCount: response.successCount,
                failureCount: response.failureCount,
                failedTokens 
            });
        }

        return NextResponse.json({ error: 'No targets (tokens or topic) provided' }, { status: 400 });

    } catch (error) {
        console.error('API Send Notification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
