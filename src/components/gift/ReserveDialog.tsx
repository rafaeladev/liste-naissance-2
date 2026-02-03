import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useReserveGift, useUnreserveGift } from '@/hooks/useGifts';
import { GiftWithContributions } from '@/types/gift';
import { Gift, Unlock } from 'lucide-react';

interface ReserveDialogProps {
    gift: GiftWithContributions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReserveDialog({ gift, open, onOpenChange }: ReserveDialogProps) {
    const [name, setName] = useState('');
    const { toast } = useToast();
    const reserveGift = useReserveGift();
    const unreserveGift = useUnreserveGift();
    const [paypalAmount, setPaypalAmount] = useState(gift.price.toString());
    const [step, setStep] = useState<'form' | 'confirm'>('form');
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);

    const handleOpenPaypal = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            return;
        }

        const amountNumber = Number(paypalAmount);
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer un montant valide',
                variant: 'destructive',
            });
            return;
        }

        const paypalMe = 'https://www.paypal.me/listenaissancemenguy';
        const url = `${paypalMe}/${amountNumber.toFixed(2)}`;

        window.open(url, '_blank', 'noopener,noreferrer');

        setPendingAmount(amountNumber);
        setStep('confirm');
    };

    const handleConfirmPaid = async () => {
        try {
            await reserveGift.mutateAsync({ id: gift.id, reservedBy: name.trim() });
            toast({ title: 'Cadeau réservé 🎁', description: `Merci ${name} !` });
            setName('');
            setPaypalAmount('');
            setPendingAmount(null);
            setStep('form');
            onOpenChange(false);
        } catch {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue',
                variant: 'destructive',
            });
        }
    };

    const handleCancel = () => {
        setPendingAmount(null);
        setStep('form');
    };

    const handleReserveAndPay = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            return;
        }

        const amountNumber = parseFloat(paypalAmount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer un montant valide',
                variant: 'destructive',
            });
            return;
        }

        try {
            // 1) Ouvrir PayPal.me
            const paypalMe = 'https://www.paypal.me/listenaissancemenguy';
            const url = `${paypalMe}/${amountNumber.toFixed(2)}`;
            window.open(url, '_blank', 'noopener,noreferrer');

            // 2) Réserver le cadeau dans Supabase
            await reserveGift.mutateAsync({ id: gift.id, reservedBy: name.trim() });

            toast({ title: 'Cadeau réservé 🎁', description: `PayPal ouvert. Merci ${name} !` });

            setName('');
            setPaypalAmount('');
            onOpenChange(false);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue',
                variant: 'destructive',
            });
        }
    };

    const handleUnreserve = async () => {
        try {
            await unreserveGift.mutateAsync(gift.id);
            toast({
                title: 'Réservation annulée',
                description: 'Le cadeau est à nouveau disponible',
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue',
                variant: 'destructive',
            });
        }
    };

    if (gift.reserved) {
        return (
            <Dialog
                open={open}
                onOpenChange={onOpenChange}
            >
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle className='font-display'>Cadeau déjà réservé</DialogTitle>
                        <DialogDescription>
                            Ce cadeau a été réservé par <strong>{gift.reserved_by}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant='outline'
                                className='w-full'
                            >
                                <Unlock className='w-4 h-4 mr-2' />
                                Libérer ce cadeau
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir libérer ce cadeau ? Il redeviendra
                                    disponible pour les autres.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUnreserve}>
                                    Confirmer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='font-display flex items-center gap-2'>
                        <Gift className='w-5 h-5 text-primary' />
                        Réserver ce cadeau
                    </DialogTitle>
                    <DialogDescription>
                        Réservez « {gift.title} » pour l'offrir (paiement via PayPal)
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' ? (
                    <form
                        onSubmit={handleOpenPaypal}
                        className='space-y-4'
                    >
                        <div className='space-y-2'>
                            <Label htmlFor='reserveName'>Votre nom</Label>
                            <Input
                                id='reserveName'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='reserveAmount'>Montant à payer : </Label>
                            {gift.price} €
                        </div>

                        <Button
                            type='submit'
                            className='w-full'
                        >
                            Ouvrir PayPal
                        </Button>

                        <p className='text-xs text-muted-foreground text-center'>
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
                            disabled={reserveGift.isPending}
                        >
                            J’ai payé ✅
                        </Button>

                        <Button
                            className='w-full'
                            variant='outline'
                            onClick={handleCancel}
                        >
                            Annuler
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
