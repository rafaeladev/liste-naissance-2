import { useState } from 'react';
import { Gift, ExternalLink, Users, Check, Lock, Heart, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GiftWithContributions } from '@/types/gift';
import { ContributeDialog } from './ContributeDialog';
import { ReserveDialog } from './ReserveDialog';
import { ImageLightbox } from './ImageLightbox';
import { cn } from '@/lib/utils';
import { useUnreserveGift } from '@/hooks/useGifts';
import { useDeleteContribution } from '@/hooks/useGifts';

interface GiftCardProps {
    gift: GiftWithContributions;
    onEdit?: () => void;
    onDelete?: () => void;
    isAdmin?: boolean;
}

export function GiftCard({ gift, onEdit, onDelete, isAdmin }: GiftCardProps) {
    const [showContribute, setShowContribute] = useState(false);
    const [showReserve, setShowReserve] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const unreserveGift = useUnreserveGift();
    const deleteContribution = useDeleteContribution();
    const progressPercent =
        gift.is_shared && gift.target_amount
            ? Math.min((gift.total_contributed / gift.target_amount) * 100, 100)
            : 0;

    console.log(progressPercent);

    const remainingAmount =
        gift.is_shared && gift.target_amount
            ? Math.max(gift.target_amount - gift.total_contributed, 0)
            : 0;

    const isFullyFunded =
        gift.is_shared && gift.target_amount && gift.total_contributed >= gift.target_amount;

    return (
        <>
            <Card
                className={cn(
                    'group overflow-hidden transition-all duration-300 hover:shadow-card animate-fade-in',
                    gift.reserved && 'opacity-75',
                    isFullyFunded && 'ring-2 ring-success',
                )}
            >
                {/* Image Gallery */}
                {gift.images && gift.images.length > 0 && (
                    <div className='relative aspect-[4/3] overflow-hidden bg-muted'>
                        <img
                            src={gift.images[0]}
                            alt={gift.title}
                            className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer'
                            onClick={() => setLightboxIndex(0)}
                        />
                        {gift.images.length > 1 && (
                            <div className='absolute bottom-2 right-2 flex gap-1'>
                                {gift.images.slice(1, 4).map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setLightboxIndex(i + 1)}
                                        className='w-10 h-10 rounded-md overflow-hidden border-2 border-card shadow-sm hover:scale-105 transition-transform'
                                    >
                                        <img
                                            src={img}
                                            alt=''
                                            className='w-full h-full object-cover'
                                        />
                                    </button>
                                ))}
                                {gift.images.length > 4 && (
                                    <div className='w-10 h-10 rounded-md bg-foreground/80 text-card flex items-center justify-center text-xs font-semibold'>
                                        +{gift.images.length - 4}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Status badges */}
                        <div className='absolute top-2 left-2 flex flex-col gap-1'>
                            {gift.category && (
                                <Badge
                                    variant='secondary'
                                    className='bg-card/80 text-foreground shadow-sm capitalize'
                                >
                                    {gift.category}
                                </Badge>
                            )}

                            {gift.is_shared && (
                                <Badge
                                    variant='secondary'
                                    className='bg-accent text-accent-foreground shadow-sm'
                                >
                                    <Users className='w-3 h-3 mr-1' />
                                    Cagnotte
                                </Badge>
                            )}
                            {gift.reserved && (
                                <Badge
                                    variant='secondary'
                                    className='bg-muted text-muted-foreground shadow-sm'
                                >
                                    <Lock className='w-3 h-3 mr-1' />
                                    Réservé
                                </Badge>
                            )}
                            {isFullyFunded && (
                                <Badge className='bg-success text-success-foreground shadow-sm'>
                                    <Check className='w-3 h-3 mr-1' />
                                    Financé !
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                <CardContent className='p-5'>
                    {/* Title & Price */}
                    <div className='flex items-start justify-between gap-2 mb-2'>
                        <h3 className='font-display text-lg font-semibold leading-tight'>
                            {gift.title}
                        </h3>
                        {gift.price && (
                            <span className='text-primary font-bold whitespace-nowrap'>
                                {gift.price.toFixed(2)} €
                            </span>
                        )}
                    </div>

                    {/* Notes */}
                    {gift.notes && (
                        <p className='text-muted-foreground text-sm mb-3 line-clamp-2'>
                            {gift.notes}
                        </p>
                    )}

                    {/* External Link */}
                    {gift.link && (
                        <a
                            href={gift.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center text-sm text-primary hover:underline mb-3'
                        >
                            <ExternalLink className='w-3 h-3 mr-1' />
                            Voir le produit
                        </a>
                    )}

                    {/* Progress Bar for Shared Gifts */}
                    {gift.is_shared && gift.target_amount && (
                        <div className='mb-4'>
                            <div className='flex justify-between text-sm mb-1'>
                                <span className='text-muted-foreground'>
                                    {gift.total_contributed.toFixed(2)} € collectés
                                </span>
                                <span className='font-medium'>
                                    {gift.target_amount.toFixed(2)} €
                                </span>
                            </div>
                            <Progress
                                value={progressPercent}
                                className='h-2.5'
                            />
                            {!isFullyFunded && (
                                <p className='text-xs text-muted-foreground mt-1'>
                                    Reste {remainingAmount.toFixed(2)} € à financer
                                </p>
                            )}
                        </div>
                    )}

                    {/* Contributors List */}
                    {/* Contributors List */}
                    {gift.is_shared && gift.contributions.length > 0 && (
                        <div className='mb-4 p-3 bg-muted/50 rounded-lg'>
                            <p className='text-xs font-medium text-muted-foreground mb-2'>
                                {gift.contributions.length} contributeur
                                {gift.contributions.length > 1 ? 's' : ''}
                            </p>

                            <div className='flex flex-wrap gap-2'>
                                {gift.contributions.slice(0, 5).map((c) => (
                                    <div
                                        key={c.id}
                                        className='flex items-center gap-1'
                                    >
                                        <Badge
                                            variant='outline'
                                            className='text-xs'
                                        >
                                            {c.name}{' '}
                                            {c.show_amount && `• ${Number(c.amount).toFixed(0)}€`}
                                        </Badge>

                                        {isAdmin && (
                                            <button
                                                type='button'
                                                onClick={() => deleteContribution.mutate(c.id)}
                                                className='text-destructive hover:scale-110 transition text-xs'
                                            >
                                                <Trash2 className='w-3 h-3 text-destructive cursor-pointer hover:scale-110 transition' />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {gift.contributions.length > 5 && (
                                    <Badge
                                        variant='outline'
                                        className='text-xs'
                                    >
                                        +{gift.contributions.length - 5}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reserved By */}
                    {gift.reserved && gift.reserved_by && (
                        <div className='flex items-center justify-between gap-2 mb-3'>
                            <p className='text-sm text-muted-foreground'>
                                Cadeau réservé par{' '}
                                <span className='font-medium'>{gift.reserved_by}</span>
                                <Heart className='w-3 h-3 text-destructive inline ml-1' />
                            </p>

                            {isAdmin && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={async () => {
                                        try {
                                            await unreserveGift.mutateAsync(gift.id);
                                        } catch {
                                            // Handle error (e.g., show notification)
                                        }
                                    }}
                                >
                                    Retirer
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className='flex gap-2 flex-wrap'>
                        {gift.is_shared && !isFullyFunded && (
                            <Button
                                onClick={() => setShowContribute(true)}
                                className='flex-1 gradient-primary-smooth text-primary-foreground  transition-all duration-500 ease-in-out'
                            >
                                <Gift className='w-4 h-4 mr-2' />
                                Participer
                            </Button>
                        )}
                        {!gift.is_shared && !gift.reserved && (
                            <Button
                                onClick={() => setShowReserve(true)}
                                className='flex-1 gradient-primary-smooth text-primary-foreground  transition-all duration-500 ease-in-out'
                                variant='default'
                            >
                                <Gift className='w-4 h-4 mr-2' />
                                Réserver
                            </Button>
                        )}
                        {isAdmin && (
                            <>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={onEdit}
                                >
                                    Modifier
                                </Button>
                                <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={onDelete}
                                >
                                    Supprimer
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ContributeDialog
                gift={gift}
                open={showContribute}
                onOpenChange={setShowContribute}
            />
            <ReserveDialog
                gift={gift}
                open={showReserve}
                onOpenChange={setShowReserve}
            />
            {lightboxIndex !== null && (
                <ImageLightbox
                    images={gift.images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}
