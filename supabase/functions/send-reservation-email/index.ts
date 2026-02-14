import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// deno-lint-ignore no-window-prefix
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TO_EMAIL = Deno.env.get('RESERVATION_TO_EMAIL');

// ⚠️ pour test: simple et accepté
const FROM_EMAIL = Deno.env.get('RESERVATION_FROM_EMAIL') ?? 'onboarding@resend.dev';

serve(async (req: Request) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        if (!RESEND_API_KEY || !TO_EMAIL) {
            console.log('Missing secrets:', { hasKey: !!RESEND_API_KEY, hasTo: !!TO_EMAIL });
            return new Response('Missing email configuration', {
                status: 500,
                headers: corsHeaders,
            });
        }

        const body = await req.json().catch(() => ({}));
        const { giftTitle, reservedBy, amount, payerEmail, message } = body ?? {};

        console.log('Payload received:', {
            giftTitle,
            reservedBy,
            amount,
            payerEmail: !!payerEmail,
        });

        if (!giftTitle || !reservedBy || typeof amount !== 'number') {
            return new Response('Invalid payload', { status: 400, headers: corsHeaders });
        }

        const subject = `🎁 Cadeau réservé : ${giftTitle}`;
        const text = [
            `Cadeau : ${giftTitle}`,
            `Réservé par : ${reservedBy}`,
            `Montant : ${amount.toFixed(2)} €`,
            payerEmail ? `Email : ${payerEmail}` : `Email : (non fourni)`,
            '',
            'Message :',
            message ? message : '(aucun message)',
        ].join('\n');

        const resendPayload = {
            from: FROM_EMAIL,
            to: [TO_EMAIL],
            subject,
            text,
        };

        console.log('Sending to Resend:', { from: FROM_EMAIL, to: TO_EMAIL });

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resendPayload),
        });

        const resendText = await resendRes.text();
        console.log('Resend response:', { status: resendRes.status, body: resendText });

        if (!resendRes.ok) {
            return new Response(
                JSON.stringify({ ok: false, resendStatus: resendRes.status, error: resendText }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.log('Server error:', String(e));
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
