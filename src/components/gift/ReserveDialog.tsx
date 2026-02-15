import { useState, useEffect } from 'react';
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
import { Gift, Unlock, BadgeCheck, CreditCard } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { BANK } from '@/config';

interface ReserveDialogProps {
    gift: GiftWithContributions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type SendReservationEmailResponse =
    | { ok: true }
    | { ok: false; resendStatus?: number; error: string };

type PaymentMethod = 'paypal' | 'bank';
type Step = 'form' | 'confirm' | 'bank';

export function ReserveDialog({ gift, open, onOpenChange }: ReserveDialogProps) {
    const [name, setName] = useState('');
    const { toast } = useToast();
    const reserveGift = useReserveGift();
    const unreserveGift = useUnreserveGift();
    const [paypalAmount, setPaypalAmount] = useState(gift.price.toString());
    const [step, setStep] = useState<Step>('form');
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);
    const amountToSend = pendingAmount ?? Number(paypalAmount);

    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

    const handleContinue = (e: React.FormEvent) => {
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

        setPendingAmount(amountNumber);

        if (paymentMethod === 'paypal') {
            const paypalMe = 'https://www.paypal.me/listenaissancemenguy';
            const url = `${paypalMe}/${amountNumber.toFixed(2)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            setStep('confirm'); // J’ai payé
        } else {
            setStep('bank'); // écran RIB
        }
    };

    const handleConfirmPaid = async () => {
        try {
            await reserveGift.mutateAsync({ id: gift.id, reservedBy: name.trim() });
            // ✅ Envoi mail (best-effort)

            const { data, error } = await supabase.functions.invoke<SendReservationEmailResponse>(
                'send-reservation-email',
                {
                    body: {
                        giftTitle: gift.title,
                        reservedBy: name.trim(),
                        amount: amountToSend,
                        payerEmail: email.trim() || null,
                        message: message.trim() || null,
                    },
                },
            );

            if (error) {
                console.error('Edge function returned error:', error);
                toast({
                    title: 'Mail non envoyé',
                    description: data?.ok === false ? data.error : error.message,
                    variant: 'destructive',
                });
                return;
            }
            toast({ title: 'Cadeau réservé 🎁', description: `Merci ${name} !` });
            setName('');
            setPaypalAmount('');
            setPendingAmount(null);
            setStep('form');
            onOpenChange(false);
            setEmail('');
            setMessage('');
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

    const resetForm = () => {
        setName('');
        setPaypalAmount(gift.price?.toString() ?? '');
        setPendingAmount(null);
        setMessage('');
        setEmail('');
        setStep('form');
        setPaymentMethod('paypal');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
    };

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            setPaypalAmount(gift.price?.toString() ?? '');
            setStep('form');
            setPendingAmount(null);
        }
    }, [gift.id, open, gift.price]);

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
            onOpenChange={handleOpenChange}
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
                        onSubmit={handleContinue}
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
                            <Label>Montant</Label>
                            <div className='flex items-center justify-between p-3 '>
                                {/* <span className='text-sm'>{gift.title}</span> */}
                                <span className='font-semibold'>{paypalAmount} €</span>
                            </div>
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
                            disabled={reserveGift.isPending}
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
                            disabled={reserveGift.isPending || pendingAmount == null}
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
