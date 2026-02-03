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
import { Heart, CreditCard, Gift } from 'lucide-react';

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

export function FreeDonationDialog({
    open,
    onOpenChange,
    minAmount = 1,
    paypalMeUrl = 'https://paypal.me/listenaissancemenguy',
    title = 'Faire un don libre',
    description = 'Choisissez le montant que vous souhaitez offrir 💛',
    onRecordDonation,
}: FreeDonationDialogProps) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const donationAmount = parseFloat(amount);

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            return;
        }

        if (Number.isNaN(donationAmount) || donationAmount < minAmount) {
            toast({
                title: 'Erreur',
                description: `Le montant minimum est de ${minAmount.toFixed(2)} €`,
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        try {
            // 1) Ouvrir PayPal.me avec le montant
            const url = `${paypalMeUrl}/${donationAmount.toFixed(2)}`;
            window.open(url, '_blank', 'noopener,noreferrer');

            // 2) Optionnel : enregistrer quelque part (si tu as un endpoint/table donations)
            if (onRecordDonation) {
                await onRecordDonation({ name: name.trim(), amount: donationAmount });
            }

            toast({
                title: 'Merci ! 🎉',
                description: 'PayPal est ouvert dans un nouvel onglet.',
            });

            setName('');
            setAmount('');
            onOpenChange(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Une erreur est survenue';
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
                        <Gift className='w-5 h-5 text-primary' />
                        {title}
                    </DialogTitle>
                    <DialogDescription className='flex items-center gap-2'>
                        <Heart className='w-4 h-4 text-primary' />
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className='space-y-4'
                >
                    <div className='space-y-2'>
                        <Label htmlFor='donor-name'>Votre nom</Label>
                        <Input
                            id='donor-name'
                            placeholder='Ex: Marie Dupont'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
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
                            placeholder={`Min. ${minAmount.toFixed(2)} €`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={isProcessing}
                        />
                        <p className='text-xs text-muted-foreground'>
                            Don libre : vous choisissez le montant.
                        </p>
                    </div>

                    <div className='flex gap-2 flex-wrap'>
                        {[5, 10, 20, 50, 100].map((quick) => (
                            <Button
                                key={quick}
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => setAmount(String(quick))}
                                disabled={isProcessing}
                            >
                                {quick} €
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
