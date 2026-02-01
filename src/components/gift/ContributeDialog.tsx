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
import { GiftWithContributions } from '@/types/gift';
import { Heart, CreditCard } from 'lucide-react';
import { useAddContribution } from '@/hooks/useGifts';

interface ContributeDialogProps {
    gift: GiftWithContributions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContributeDialog({ gift, open, onOpenChange }: ContributeDialogProps) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const addContribution = useAddContribution();

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

        // ✅ PayPal redirect
        setIsProcessing(true);
        try {
            const contributionAmount = parseFloat(amount);

            // 1) ouvrir PayPal.me avec le montant
            const paypalMe = 'https://paypal.me/listenaissancemenguy';
            const url = `${paypalMe}/${contributionAmount.toFixed(2)}`;

            window.open(url, '_blank', 'noopener,noreferrer');

            // 2) puis enregistrer la contribution (au choix)
            // Option A (direct) : on enregistre tout de suite (confiance)
            await addContribution.mutateAsync({
                gift_id: gift.id,
                name: name.trim(),
                amount: contributionAmount,
                payment_provider: 'PayPal.Me',
                payment_id: null,
            });

            toast({
                title: 'Merci ! 🎉',
                description: 'Paiement ouvert sur PayPal. Contribution enregistrée.',
            });

            setName('');
            setAmount('');
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue';
            toast({ title: 'Erreur', description: message, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='font-display flex items-center gap-2'>
                        <Heart className='w-5 h-5 text-primary' />
                        Participer à la cagnotte
                    </DialogTitle>
                    <DialogDescription>Contribuez pour « {gift.title} »</DialogDescription>
                </DialogHeader>

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
                                Payer avec PayPal
                            </>
                        )}
                    </Button>

                    <p className='text-xs text-center text-muted-foreground'>
                        Vous serez redirigé vers PayPal pour finaliser le paiement.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
