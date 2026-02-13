import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateGift, useUpdateGift } from '@/hooks/useGifts';
import { Gift, GiftWithContributions } from '@/types/gift';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

interface GiftFormDialogProps {
    gift?: GiftWithContributions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GiftFormDialog({ gift, open, onOpenChange }: GiftFormDialogProps) {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [targetAmount, setTargetAmount] = useState('');
    const [minContribution, setMinContribution] = useState('');
    const [availableImages, setAvailableImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const categories = ['décoration', 'déplacements', 'dodo', 'jeux', 'repas', 'autres'] as const;

    const [category, setCategory] = useState<Gift['category']>(gift?.category ?? 'autres');

    const { toast } = useToast();
    const createGift = useCreateGift();
    const updateGift = useUpdateGift();

    const isEditing = !!gift;

    useEffect(() => {
        if (gift) {
            setTitle(gift.title);
            setPrice(gift.price?.toString() || '');
            setLink(gift.link || '');
            setNotes(gift.notes || '');
            setImages(gift.images || []);
            setIsShared(gift.is_shared);
            setTargetAmount(gift.target_amount?.toString() || '');
            setMinContribution(gift.min_contribution?.toString() || '');
            setCategory(gift.category ?? 'autres');
        } else {
            resetForm();
        }
    }, [gift, open]);

    const resetForm = () => {
        setTitle('');
        setPrice('');
        setLink('');
        setNotes('');
        setImages([]);
        setNewImageUrl('');
        setIsShared(false);
        setTargetAmount('');
        setMinContribution('');
        setCategory('autres');
    };

    const addImage = () => {
        if (newImageUrl.trim()) {
            setImages([...images, newImageUrl.trim()]);
            setNewImageUrl('');
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({
                title: 'Erreur',
                description: 'Le titre est obligatoire',
                variant: 'destructive',
            });
            return;
        }

        const giftData = {
            title: title.trim(),
            price: price ? parseFloat(price) : null,
            link: link.trim() || null,
            notes: notes.trim() || null,
            images,
            is_shared: isShared,
            target_amount: isShared && targetAmount ? parseFloat(targetAmount) : null,
            min_contribution: isShared && minContribution ? parseFloat(minContribution) : null,
            reserved: gift?.reserved || false,
            reserved_by: gift?.reserved_by || null,
            category: category,
        };

        try {
            if (isEditing) {
                await updateGift.mutateAsync({ id: gift.id, ...giftData });
                toast({
                    title: 'Cadeau modifié',
                    description: 'Les modifications ont été enregistrées',
                });
            } else {
                await createGift.mutateAsync(giftData);
                toast({
                    title: 'Cadeau ajouté ! 🎁',
                    description: 'Le cadeau a été ajouté à la liste',
                });
            }
            onOpenChange(false);
            resetForm();
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        async function loadManifest() {
            try {
                const res = await fetch('/images/manifest.json', { cache: 'no-store' });
                const data = await res.json();
                if (Array.isArray(data)) setAvailableImages(data);
            } catch (e) {
                console.error('Impossible de charger /images/manifest.json', e);
                setAvailableImages([]);
            }
        }
        loadManifest();
    }, []);

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='font-display'>
                        {isEditing ? 'Modifier le cadeau' : 'Ajouter un cadeau'}
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className='space-y-4'
                >
                    {/* Title */}
                    <div className='space-y-2'>
                        <Label htmlFor='title'>Titre *</Label>
                        <Input
                            id='title'
                            placeholder='Ex: Poussette Yoyo'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className='space-y-2'>
                        <Label htmlFor='category'>Catégorie</Label>
                        <select
                            id='category'
                            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Gift['category'])}
                        >
                            {categories.map((cat) => (
                                <option
                                    key={cat}
                                    value={cat}
                                    className='capitalize'
                                >
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div className='space-y-2'>
                        <Label htmlFor='price'>Prix indicatif (€)</Label>
                        <Input
                            id='price'
                            type='number'
                            step='0.01'
                            min='0'
                            placeholder='Ex: 299.99'
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    {/* Link */}
                    <div className='space-y-2'>
                        <Label htmlFor='link'>Lien vers le produit</Label>
                        <Input
                            id='link'
                            type='url'
                            placeholder='https://...'
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className='space-y-2'>
                        <Label htmlFor='notes'>Description / Notes</Label>
                        <Textarea
                            id='notes'
                            placeholder='Détails, couleur préférée, taille...'
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Images depuis public/images */}
                    <div className='space-y-2'>
                        <Label>Images (public/images)</Label>

                        <div className='flex gap-2'>
                            <select
                                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                                value={selectedImage}
                                onChange={(e) => setSelectedImage(e.target.value)}
                            >
                                <option value=''>Choisir une image…</option>
                                {availableImages.map((name) => (
                                    <option
                                        key={name}
                                        value={name}
                                    >
                                        {name}
                                    </option>
                                ))}
                            </select>

                            <Button
                                type='button'
                                variant='outline'
                                onClick={() => {
                                    if (!selectedImage) return;
                                    const url = `/images/${selectedImage}`;
                                    if (images.includes(url)) return;
                                    setImages([...images, url]);
                                    setSelectedImage('');
                                }}
                            >
                                <Plus className='w-4 h-4 mr-2' />
                                Ajouter
                            </Button>
                        </div>

                        {images.length > 0 && (
                            <div className='flex gap-2 flex-wrap mt-2'>
                                {images.map((url, index) => (
                                    <div
                                        key={index}
                                        className='relative group'
                                    >
                                        <img
                                            src={url}
                                            alt=''
                                            className='w-16 h-16 object-cover rounded-md border'
                                        />
                                        <button
                                            type='button'
                                            onClick={() => removeImage(index)}
                                            className='absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                                        >
                                            <X className='w-3 h-3' />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {availableImages.length === 0 && (
                            <p className='text-xs text-muted-foreground'>
                                Aucune image trouvée. Vérifie que{' '}
                                <code>/public/images/manifest.json</code> existe.
                            </p>
                        )}
                    </div>

                    {/* Shared Gift Toggle */}
                    <div className='flex items-center justify-between p-4 bg-muted/50 rounded-lg'>
                        <div>
                            <Label
                                htmlFor='isShared'
                                className='font-medium'
                            >
                                Cagnotte partagée
                            </Label>
                            <p className='text-xs text-muted-foreground'>
                                Permet à plusieurs personnes de contribuer
                            </p>
                        </div>
                        <Switch
                            id='isShared'
                            checked={isShared}
                            onCheckedChange={setIsShared}
                        />
                    </div>

                    {/* Shared Gift Options */}
                    {isShared && (
                        <div className='space-y-4 p-4 border rounded-lg'>
                            <div className='space-y-2'>
                                <Label htmlFor='targetAmount'>Montant cible (€) *</Label>
                                <Input
                                    id='targetAmount'
                                    type='number'
                                    step='0.01'
                                    min='0'
                                    placeholder='Ex: 500'
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    required={isShared}
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='minContribution'>Contribution minimum (€)</Label>
                                <Input
                                    id='minContribution'
                                    type='number'
                                    step='0.01'
                                    min='0'
                                    placeholder='Ex: 10'
                                    value={minContribution}
                                    onChange={(e) => setMinContribution(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <Button
                        type='submit'
                        className='w-full'
                        disabled={createGift.isPending || updateGift.isPending}
                    >
                        {createGift.isPending || updateGift.isPending
                            ? 'Enregistrement...'
                            : isEditing
                              ? 'Enregistrer les modifications'
                              : 'Ajouter le cadeau'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
