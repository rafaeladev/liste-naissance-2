import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TO_EMAIL = Deno.env.get('CONTRIBUTION_TO_EMAIL') ?? Deno.env.get('RESERVATION_TO_EMAIL'); // fallback
const FROM_EMAIL =
    Deno.env.get('CONTRIBUTION_FROM_EMAIL') ??
    Deno.env.get('RESERVATION_FROM_EMAIL') ??
    'Liste de naissance <onboarding@resend.dev>';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // ou mets ton domaine en prod
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Payload = {
    giftTitle: string;
    contributorName: string;
    amount: number;
    showAmount?: boolean;
};

serve(async (req) => {
    // ✅ Preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 405,
            });
        }

        if (!RESEND_API_KEY || !TO_EMAIL) {
            return new Response(
                JSON.stringify({ ok: false, error: 'Missing email configuration' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 500,
                },
            );
        }

        const body = (await req.json()) as Partial<Payload>;
        const { giftTitle, contributorName, amount, showAmount } = body ?? {};

        if (
            !giftTitle ||
            !contributorName ||
            typeof amount !== 'number' ||
            !Number.isFinite(amount)
        ) {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const subject = `💛 Contribution : ${giftTitle}`;
        const text = [
            `Cagnotte : ${giftTitle}`,
            `Contributeur : ${contributorName}`,
            `Montant : ${amount.toFixed(2)} €`,
            `Afficher le montant : ${showAmount ? 'Oui' : 'Non'}`,
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
                JSON.stringify({
                    ok: false,
                    resendStatus: resendRes.status,
                    error: err,
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 502,
                },
            );
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
