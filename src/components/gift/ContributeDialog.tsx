import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { GiftWithContributions } from '@/types/gift';
import { Heart, CreditCard, BadgeCheck } from 'lucide-react';
import { useAddContribution } from '@/hooks/useGifts';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '../ui/textarea';
import { BANK } from '@/config';

interface ContributeDialogProps {
    gift: GiftWithContributions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type SendContributionEmailResponse =
    | { ok: true }
    | { ok: false; resendStatus?: number; error: string };

type PaymentMethod = 'paypal' | 'bank';
type Step = 'form' | 'confirm' | 'bank';

export function ContributeDialog({ gift, open, onOpenChange }: ContributeDialogProps) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const addContribution = useAddContribution();
    const [showAmount, setShowAmount] = useState(true);

    const [step, setStep] = useState<Step>('form');
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);

    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

    const remainingAmount = gift.target_amount
        ? Math.max(gift.target_amount - gift.total_contributed, 0)
        : null;

    const minAmount = gift.min_contribution || 1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const contributionAmount = Number(amount);

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            return;
        }

        if (!Number.isFinite(contributionAmount) || contributionAmount < minAmount) {
            toast({
                title: 'Erreur',
                description: `Le montant minimum est de ${minAmount.toFixed(2)} €`,
                variant: 'destructive',
            });
            return;
        }

        if (remainingAmount !== null && contributionAmount > remainingAmount) {
            toast({
                title: 'Erreur',
                description: `Le montant maximum est de ${remainingAmount.toFixed(2)} €`,
                variant: 'destructive',
            });
            return;
        }

        setPendingAmount(contributionAmount);

        if (paymentMethod === 'paypal') {
            setIsProcessing(true);
            try {
                const paypalMe = 'https://paypal.me/listenaissancemenguy';
                const url = `${paypalMe}/${contributionAmount.toFixed(2)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
                setStep('confirm');
            } finally {
                setIsProcessing(false);
            }
        } else {
            // virement -> pas de redirection, on affiche le RIB
            setStep('bank');
        }
    };

    const resetForm = () => {
        setName('');
        setAmount('');
        setEmail('');
        setMessage('');
        setShowAmount(true);
        setPaymentMethod('paypal');
        setStep('form');
        setPendingAmount(null);
        setIsProcessing(false);
    };

    const handleConfirmPaid = async () => {
        if (pendingAmount == null) return;

        setIsProcessing(true);
        try {
            // 1) enregistrer contribution
            await addContribution.mutateAsync({
                gift_id: gift.id,
                name: name.trim(),
                amount: pendingAmount,
                payment_provider: paymentMethod === 'paypal' ? 'PayPal.Me' : 'Bank transfer',
                payment_id: null,
                show_amount: showAmount,
            });

            // 2) email (best-effort)
            const { data, error } = await supabase.functions.invoke<SendContributionEmailResponse>(
                'send-contribution-email',
                {
                    body: {
                        giftTitle: gift.title,
                        contributorName: name.trim(),
                        amount: pendingAmount,
                        showAmount,
                        paymentMethod, // 👈 utile dans le mail
                        payerEmail: email.trim() || null,
                        message: message.trim() || null,
                    },
                },
            );

            if (error) {
                toast({
                    title: 'Contribution enregistrée ✅',
                    description:
                        data?.ok === false ? `Mail non envoyé: ${data.error}` : error.message,
                    variant: 'destructive',
                });
            } else {
                toast({ title: 'Merci ! 🎉', description: 'Contribution enregistrée.' });
            }

            onOpenChange(false);
            resetForm();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
            toast({ title: 'Erreur', description: msg, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setPendingAmount(null);
        setStep('form');
    };

    const handleOpenChange = (v: boolean) => {
        onOpenChange(v);
        if (!v) resetForm();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='font-display flex items-center gap-2'>
                        <Heart className='w-5 h-5 text-primary' />
                        Participer à la cagnotte
                    </DialogTitle>
                    <DialogDescription>Contribuez pour « {gift.title} »</DialogDescription>
                </DialogHeader>

                {step === 'form' ? (
                    <form
                        onSubmit={handleSubmit}
                        className='space-y-4'
                    >
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Votre nom</Label>
                            <Input
                                id='name'
                                placeholder='Ex: Marie Dupont'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isProcessing}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='reserveEmail'>Votre email (optionnel)</Label>
                            <Input
                                id='reserveEmail'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='ex: claire@email.com'
                                disabled={isProcessing}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='reserveMessage'>Message (optionnel)</Label>
                            <Textarea
                                id='reserveMessage'
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder='Un petit mot pour nous 💛'
                                rows={3}
                                disabled={isProcessing}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='amount'>Montant (€)</Label>
                            <Input
                                id='amount'
                                type='number'
                                step='0.01'
                                min={minAmount}
                                max={remainingAmount ?? undefined}
                                placeholder={`Min. ${minAmount.toFixed(2)} €`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                disabled={isProcessing}
                            />
                            {remainingAmount !== null && (
                                <p className='text-xs text-muted-foreground'>
                                    Reste {remainingAmount.toFixed(2)} € à financer
                                </p>
                            )}
                        </div>

                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='showAmount'
                                checked={showAmount}
                                onCheckedChange={(v) => setShowAmount(v === true)}
                                disabled={isProcessing}
                            />
                            <Label
                                htmlFor='showAmount'
                                className='text-sm'
                            >
                                Afficher le montant sur la liste
                            </Label>
                        </div>

                        <p className='text-xs text-muted-foreground'>
                            Si décoché, votre nom apparaîtra sans le montant.
                        </p>

                        {/* Mode de paiement */}
                        <div className='space-y-2'>
                            <Label>Mode de paiement</Label>
                            <div className='grid grid-cols-2 gap-2'>
                                <button
                                    type='button'
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`p-3 rounded-md border text-sm transition ${
                                        paymentMethod === 'paypal'
                                            ? 'bg-primary/20 border-primary'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    PayPal
                                </button>

                                <button
                                    type='button'
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`p-3 rounded-md border text-sm transition ${
                                        paymentMethod === 'bank'
                                            ? 'bg-primary/20 border-primary'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    Virement
                                </button>
                            </div>

                            {/* <p className='text-xs text-muted-foreground'>
                                {paymentMethod === 'paypal'
                                    ? 'PayPal.me (carte possible selon PayPal)'
                                    : 'Vous verrez notre RIB et une référence à mettre.'}
                            </p> */}
                        </div>

                        <Button
                            type='submit'
                            className='w-full gradient-primary text-primary-foreground'
                            disabled={isProcessing}
                        >
                            {paymentMethod === 'paypal' ? (
                                <>
                                    <CreditCard className='w-4 h-4 mr-2' />
                                    Ouvrir PayPal
                                </>
                            ) : (
                                'Voir le RIB'
                            )}
                        </Button>

                        <p className='text-xs text-center text-muted-foreground'>
                            {paymentMethod === 'paypal'
                                ? 'Vous serez redirigé vers PayPal. Revenez ici ensuite.'
                                : 'Vous verrez nos informations bancaires. Faites le virement puis revenez cliquer sur “J’ai fait le virement”.'}
                        </p>
                    </form>
                ) : step === 'confirm' ? (
                    <div className='space-y-4'>
                        <p className='text-sm'>
                            PayPal a été ouvert pour <strong>{pendingAmount?.toFixed(2)} €</strong>.
                            <br />
                            Quand vous avez terminé le paiement, cliquez sur{' '}
                            <strong>J’ai payé</strong>.
                        </p>

                        <Button
                            className='w-full'
                            onClick={handleConfirmPaid}
                            disabled={isProcessing || pendingAmount == null}
                        >
                            J’ai payé <BadgeCheck />
                        </Button>

                        <Button
                            className='w-full'
                            variant='outline'
                            onClick={handleCancel}
                            disabled={isProcessing}
                        >
                            Annuler
                        </Button>
                    </div>
                ) : (
                    // step === 'bank'
                    <div className='space-y-4'>
                        <div className='rounded-lg border p-4 bg-muted/30'>
                            <p className='text-sm font-medium mb-2'>Virement bancaire</p>

                            <div className='text-sm space-y-1'>
                                <div>
                                    <span className='text-muted-foreground'>Titulaire :</span>{' '}
                                    {BANK.holder}
                                </div>
                                <div>
                                    <span className='text-muted-foreground'>IBAN :</span>{' '}
                                    <span className='font-mono'>{BANK.iban}</span>
                                </div>
                                <div>
                                    <span className='text-muted-foreground'>BIC :</span>{' '}
                                    <span className='font-mono'>{BANK.bic}</span>
                                </div>
                                {BANK.bankName && (
                                    <div>
                                        <span className='text-muted-foreground'>Banque :</span>{' '}
                                        {BANK.bankName}
                                    </div>
                                )}

                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={() => navigator.clipboard.writeText(BANK.iban)}
                                >
                                    Copier l’IBAN
                                </Button>
                            </div>

                            <div className='mt-3 text-sm'>
                                <span className='text-muted-foreground'>Montant :</span>{' '}
                                <strong>{pendingAmount?.toFixed(2)} €</strong>
                            </div>

                            <div className='mt-2 text-sm'>
                                <span className='text-muted-foreground'>Référence :</span>{' '}
                                <strong>
                                    LN - {gift.title} - {name.trim()}
                                </strong>
                            </div>

                            <p className='mt-3 text-xs text-muted-foreground'>
                                Pensez à mettre la référence pour qu’on puisse retrouver votre
                                virement.
                            </p>
                        </div>

                        <Button
                            className='w-full'
                            onClick={handleConfirmPaid}
                            disabled={isProcessing || pendingAmount == null}
                        >
                            J’ai fait le virement <BadgeCheck />
                        </Button>

                        <Button
                            className='w-full'
                            variant='outline'
                            onClick={handleCancel}
                            disabled={isProcessing}
                        >
                            Retour
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
