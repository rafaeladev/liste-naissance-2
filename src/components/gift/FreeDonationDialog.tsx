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
import { Heart, CreditCard, Gift, BadgeCheck } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { BANK } from '@/config';

interface FreeDonationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    minAmount?: number;
    paypalMeUrl?: string;

    title?: string;
    description?: string;

    /**
     * Optionnel : callback si tu veux enregistrer le don quelque part
     * (table "donations", webhook, etc.)
     */
    onRecordDonation?: (payload: { name: string; amount: number }) => Promise<void>;
}

type SendFreeDonationEmailResponse =
    | { ok: true }
    | { ok: false; resendStatus?: number; error: string };

type PaymentMethod = 'paypal' | 'bank';
type Step = 'form' | 'confirm' | 'bank';

export function FreeDonationDialog({
    open,
    onOpenChange,
    minAmount = 1,
    paypalMeUrl = 'https://paypal.me/listenaissancemenguy',
    title = 'Faire un don libre',
    description = 'Choisissez le montant que vous souhaitez offrir',
    onRecordDonation,
}: FreeDonationDialogProps) {
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [message, setMessage] = useState('');

    const [step, setStep] = useState<Step>('form');
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();

        const donationAmount = Number(amount);

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            return;
        }

        if (!Number.isFinite(donationAmount) || donationAmount < minAmount) {
            toast({
                title: 'Erreur',
                description: `Le montant minimum est de ${minAmount.toFixed(2)} €`,
                variant: 'destructive',
            });
            return;
        }

        setPendingAmount(donationAmount);

        if (paymentMethod === 'paypal') {
            const url = `${paypalMeUrl}/${donationAmount.toFixed(2)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            setStep('confirm');
        } else {
            setStep('bank');
        }
    };

    const handleConfirmPaid = async () => {
        if (pendingAmount == null) return;

        setIsProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke<SendFreeDonationEmailResponse>(
                'send-free-donation-email',
                {
                    body: {
                        donorName: name.trim(),
                        amount: pendingAmount,
                        donorEmail: donorEmail.trim() || null,
                        message: message.trim() || null,
                    },
                },
            );

            if (error) {
                toast({
                    title: 'Don confirmé ✅ (mail non envoyé)',
                    description: data?.ok === false ? data.error : error.message,
                    variant: 'destructive',
                });
            } else {
                toast({ title: 'Merci ! 💛', description: 'Don confirmé et mail envoyé.' });
            }

            // reset + close
            setName('');
            setAmount('');
            setDonorEmail('');
            setMessage('');
            setPendingAmount(null);
            setStep('form');
            onOpenChange(false);
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

    const resetForm = () => {
        setName('');
        setAmount('');
        setDonorEmail('');
        setMessage('');
        setPendingAmount(null);
        setStep('form');
        setPaymentMethod('paypal');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='font-display flex items-center gap-2'>
                        <Gift className='w-5 h-5 text-primary' />
                        {title}
                    </DialogTitle>
                    <DialogDescription className='flex items-center gap-2'>
                        <Heart className='w-4 h-4 text-primary' />
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' ? (
                    <form
                        onSubmit={handleContinue}
                        className='space-y-4'
                    >
                        <div className='space-y-2'>
                            <Label htmlFor='donor-name'>Votre nom</Label>
                            <Input
                                id='donor-name'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isProcessing}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='donor-email'>Votre email (optionnel)</Label>
                            <Input
                                id='donor-email'
                                type='email'
                                value={donorEmail}
                                onChange={(e) => setDonorEmail(e.target.value)}
                                placeholder='ex: claire@email.com'
                                disabled={isProcessing}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='donor-message'>Message (optionnel)</Label>
                            <Textarea
                                id='donor-message'
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder='Un petit mot pour nous 💛'
                                rows={3}
                                disabled={isProcessing}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='donation-amount'>Montant (€)</Label>
                            <Input
                                id='donation-amount'
                                type='number'
                                inputMode='decimal'
                                step='0.01'
                                min={minAmount}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                disabled={isProcessing}
                            />
                        </div>

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
                            className='w-full'
                        >
                            {paymentMethod === 'paypal' ? 'Ouvrir PayPal' : 'Voir le RIB'}
                        </Button>

                        <p className='text-xs text-muted-foreground text-center'>
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
                            disabled={isProcessing}
                        >
                            J’ai payé <BadgeCheck />
                        </Button>

                        <Button
                            className='w-full'
                            variant='outline'
                            onClick={handleCancel}
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
                                <strong>LN - don libre - {name.trim()}</strong>
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
                        >
                            Retour
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
