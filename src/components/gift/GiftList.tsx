import { useState } from 'react';
import { useGifts, useDeleteGift } from '@/hooks/useGifts';
import { useAdmin } from '@/contexts/AdminContext';
import { GiftCard } from './GiftCard';
import { GiftFormDialog } from './GiftFormDialog';
import { Gift, GiftWithContributions } from '@/types/gift';

import {
    Loader2,
    Package,
    Search,
    ChevronsRight,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    Heart,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { FreeDonationDialog } from './FreeDonationDialog';

export function GiftList() {
    const { data: gifts, isLoading, error } = useGifts();
    const { isAdmin } = useAdmin();
    const deleteGift = useDeleteGift();
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'available' | 'shared' | 'reserved'>('all');
    const [editingGift, setEditingGift] = useState<GiftWithContributions | null>(null);
    const [deletingGift, setDeletingGift] = useState<GiftWithContributions | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [showFreeDonation, setShowFreeDonation] = useState(false);

    // 6 cards on mobile, 12 on larger screens
    const pageSize = window.innerWidth < 640 ? 6 : 12;

    const [categoryFilter, setCategoryFilter] = useState<'all' | Gift['category']>('all');

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-20'>
                <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
        );
    }

    if (error) {
        return (
            <div className='text-center py-20'>
                <p className='text-destructive'>Erreur lors du chargement des cadeaux</p>
            </div>
        );
    }

    const filteredGifts = gifts?.filter((gift) => {
        const matchesSearch = gift.title.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || gift.category === categoryFilter;

        let matchesStatus = true;

        switch (filter) {
            case 'available':
                matchesStatus = !gift.reserved && !gift.is_shared;
                break;
            case 'shared':
                matchesStatus = gift.is_shared;
                break;
            case 'reserved':
                matchesStatus = gift.reserved;
                break;
        }

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Fonction pour verifier si un cagnotte a été complétée
    const isSharedCompleted = (gift: GiftWithContributions) => {
        if (!gift.is_shared) return false;
        const total = gift.contributions?.reduce((sum, c) => sum + (c.amount ?? 0), 0) ?? 0;
        const target = gift.price ?? 0;
        return target > 0 && total >= target;
    };

    // Tri de la liste filtrée : les cagnottes complétées en dernier
    const sortedGifts = (filteredGifts ?? []).slice().sort((a, b) => {
        const aToEnd = a.reserved || isSharedCompleted(a);
        const bToEnd = b.reserved || isSharedCompleted(b);

        // false (0) en premier, true (1) à la fin
        return Number(aToEnd) - Number(bToEnd);
    });

    const handleDelete = async () => {
        if (!deletingGift) return;

        try {
            await deleteGift.mutateAsync(deletingGift.id);
            toast({
                title: 'Cadeau supprimé',
                description: 'Le cadeau a été supprimé avec succès',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue',
                variant: 'destructive',
            });
        } finally {
            setDeletingGift(null);
        }
    };

    // Calcul des cadeaux à afficher pour la page courante
    const totalItems = filteredGifts?.length ?? 0;

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedGifts = sortedGifts.slice(startIndex, startIndex + pageSize);

    const getPageNumbers = () => {
        const delta = 2; // nombre de pages autour de la page courante
        const pages = [];

        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className='space-y-6'>
            {/* Search & Filter */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                    <Input
                        placeholder='Rechercher un cadeau...'
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className='pl-10'
                    />
                </div>
                <Select
                    value={filter}
                    onValueChange={(v) => {
                        setFilter(v as typeof filter);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className='w-full sm:w-48'>
                        <SelectValue placeholder='Filtrer' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>Tous les cadeaux</SelectItem>
                        <SelectItem value='available'>Disponibles</SelectItem>
                        <SelectItem value='shared'>Cagnottes</SelectItem>
                        <SelectItem value='reserved'>Réservés</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={categoryFilter}
                    onValueChange={(v) => {
                        setCategoryFilter(v as typeof categoryFilter);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className='w-full sm:w-48'>
                        <SelectValue placeholder='Catégorie' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>Toutes les catégories</SelectItem>
                        <SelectItem
                            value='décoration'
                            className='capitalize'
                        >
                            Décoration
                        </SelectItem>
                        <SelectItem value='déplacements'>Déplacements</SelectItem>
                        <SelectItem value='dodo'>Dodo</SelectItem>
                        <SelectItem value='jeux'>Jeux</SelectItem>
                        <SelectItem value='repas'>Repas</SelectItem>
                        <SelectItem value='autres'>Autres</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            {sortedGifts.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {/* {filteredGifts.map((gift) => (
                        <GiftCard
                            key={gift.id}
                            gift={gift}
                            isAdmin={isAdmin}
                            onEdit={() => setEditingGift(gift)}
                            onDelete={() => setDeletingGift(gift)}
                        />
                    ))} */}
                    {paginatedGifts.map((gift) => (
                        <GiftCard
                            key={gift.id}
                            gift={gift}
                            isAdmin={isAdmin}
                            onEdit={() => setEditingGift(gift)}
                            onDelete={() => setDeletingGift(gift)}
                        />
                    ))}
                </div>
            ) : (
                <div className='text-center py-20'>
                    <Package className='w-16 h-16 mx-auto text-muted-foreground/50 mb-4' />
                    <h3 className='font-display text-xl text-muted-foreground'>
                        Aucun cadeau trouvé
                    </h3>
                    <p className='text-sm text-muted-foreground mt-1'>
                        {searchQuery
                            ? "Essayez avec d'autres termes"
                            : 'La liste est vide pour le moment'}
                    </p>
                </div>
            )}

            <section className='mx-auto max-w-full mt-10 '>
                <div className='w-full flex flex-col justify-center items-center mx-auto animate-slide-up text-center gap-6 bg-gradient-to-b from-amber-50 to-amber-50/40 py-10 border border shadow-sm'>
                    <Heart className='w-10 h-10 text-yellow-400 fill-yellow-400' />
                    <h2 className='font-display text-3xl sm:text-4xl font-bold mb-4 animate-fade-in'>
                        Faire un don libre
                    </h2>
                    <p className='text-lg max-w-2xl text-muted-foreground mb-8 animate-fade-in'>
                        Si vous voulez, vous pouvez aussi faire un don libre pour nous aider à
                        préparer l'arrivée de notre bébé et à couvrir les frais liés à la naissance.
                    </p>

                    <Button
                        onClick={() => setShowFreeDonation(true)}
                        className='mx-auto inline-flex w-lg max-w-sm items-center justify-center rounded-xl bg-amber-300 px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:ring-offset-2'
                    >
                        {/* <Gift className='w-4 h-4 mr-2' /> */}
                        Faire un don
                    </Button>

                    <FreeDonationDialog
                        open={showFreeDonation}
                        onOpenChange={setShowFreeDonation}
                    />
                </div>
            </section>

            {totalPages > 1 && (
                <div className='flex flex-wrap items-center justify-center gap-2 mt-6'>
                    {/* Aller à la début */}
                    {window.innerWidth < 640 && (
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className='px-3 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-muted transition-colors duration-250 ease-in'
                        >
                            <ChevronsLeft className='h-5 w-5' />
                        </button>
                    )}
                    {/* Page précédente */}
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className='px-3 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-muted transition-colors duration-250 ease-in'
                    >
                        <ChevronLeft className='h-5 w-5' />
                    </button>

                    {/* Numéros de pages */}
                    {getPageNumbers().map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-md text-sm border ${
                                page === currentPage
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            } transition-colors duration-250 ease-in`}
                        >
                            {page}
                        </button>
                    ))}

                    {/* Page suivante */}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className='px-3 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-muted transition-colors duration-250 ease-in'
                    >
                        <ChevronRight className='h-5 w-5' />
                    </button>

                    {/* Aller à la fin */}
                    {window.innerWidth < 640 && (
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className='px-3 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-muted transition-colors duration-250 ease-in'
                        >
                            <ChevronsRight className='h-5 w-5' />
                        </button>
                    )}
                </div>
            )}

            {/* Edit Dialog */}
            {editingGift && (
                <GiftFormDialog
                    gift={editingGift}
                    open={!!editingGift}
                    onOpenChange={(open) => !open && setEditingGift(null)}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletingGift}
                onOpenChange={(open) => !open && setDeletingGift(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce cadeau ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le cadeau « {deletingGift?.title} » et
                            toutes ses contributions seront supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground'
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
