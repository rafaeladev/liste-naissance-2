// supabase/functions/send-free-donation-email/index.ts

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TO_EMAIL = Deno.env.get('RESERVATION_TO_EMAIL'); // tu peux réutiliser le même secret
const FROM_EMAIL =
    Deno.env.get('RESERVATION_FROM_EMAIL') ?? 'Liste de naissance <onboarding@resend.dev>';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!RESEND_API_KEY || !TO_EMAIL) {
            return new Response(
                JSON.stringify({ ok: false, error: 'Missing email configuration' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
            );
        }

        const body = await req.json();
        const { donorName, amount, donorEmail, message } = body ?? {};

        if (!donorName || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const subject = `💛 Don libre reçu : ${donorName} (${amount.toFixed(2)} €)`;

        const text = [
            `Donateur : ${donorName}`,
            `Montant : ${amount.toFixed(2)} €`,
            donorEmail ? `Email : ${donorEmail}` : `Email : (non fourni)`,
            '',
            'Message :',
            message ? message : '(aucun message)',
        ].join('\n');

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [TO_EMAIL],
                subject,
                text,
            }),
        });

        if (!resendRes.ok) {
            const err = await resendRes.text();
            return new Response(
                JSON.stringify({ ok: false, resendStatus: resendRes.status, error: err }),
                {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
            );
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
