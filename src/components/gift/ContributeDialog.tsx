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
import { Heart, CreditCard } from 'lucide-react';
import { useAddContribution } from '@/hooks/useGifts';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '../ui/textarea';

interface ContributeDialogProps {
    gift: GiftWithContributions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type SendContributionEmailResponse =
    | { ok: true }
    | { ok: false; resendStatus?: number; error: string };

export function ContributeDialog({ gift, open, onOpenChange }: ContributeDialogProps) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const addContribution = useAddContribution();
    const [showAmount, setShowAmount] = useState(true);

    const [step, setStep] = useState<'form' | 'confirm'>('form');
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);

    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');

    const remainingAmount = gift.target_amount
        ? Math.max(gift.target_amount - gift.total_contributed, 0)
        : null;

    const minAmount = gift.min_contribution || 1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const contributionAmount = parseFloat(amount);

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            return;
        }

        if (isNaN(contributionAmount) || contributionAmount < minAmount) {
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

        setIsProcessing(true);
        try {
            const paypalMe = 'https://paypal.me/listenaissancemenguy';
            const url = `${paypalMe}/${contributionAmount.toFixed(2)}`;
            window.open(url, '_blank', 'noopener,noreferrer');

            setPendingAmount(contributionAmount);
            setStep('confirm');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPaid = async () => {
        if (pendingAmount == null) return;

        setIsProcessing(true);
        try {
            await addContribution.mutateAsync({
                gift_id: gift.id,
                name: name.trim(),
                amount: pendingAmount,
                payment_provider: 'PayPal.Me',
                payment_id: null,
                show_amount: showAmount,
            });

            const { data, error } = await supabase.functions.invoke<SendContributionEmailResponse>(
                'send-contribution-email',
                {
                    body: {
                        giftTitle: gift.title,
                        contributorName: name.trim(),
                        amount: pendingAmount,
                        showAmount,
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

            setName('');
            setAmount('');
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

    const handleOpenChange = (v: boolean) => {
        onOpenChange(v);
        if (!v) {
            setStep('form');
            setPendingAmount(null);
            setIsProcessing(false);
        }
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

                        <div className='flex gap-2 flex-wrap'>
                            {[10, 20, 50, 100].map((quickAmount) => (
                                <Button
                                    key={quickAmount}
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setAmount(quickAmount.toString())}
                                    disabled={
                                        isProcessing ||
                                        (remainingAmount !== null && quickAmount > remainingAmount)
                                    }
                                >
                                    {quickAmount} €
                                </Button>
                            ))}
                        </div>

                        <Button
                            type='submit'
                            className='w-full gradient-primary text-primary-foreground'
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                'Redirection vers PayPal...'
                            ) : (
                                <>
                                    <CreditCard className='w-4 h-4 mr-2' />
                                    Ouvrir PayPal
                                </>
                            )}
                        </Button>

                        <p className='text-xs text-center text-muted-foreground'>
                            Vous serez redirigé vers PayPal. Revenez ici ensuite.
                        </p>
                    </form>
                ) : (
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
                            J’ai payé ✅
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
                )}
            </DialogContent>
        </Dialog>
    );
}
