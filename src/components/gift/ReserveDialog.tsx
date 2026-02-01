import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useReserveGift, useUnreserveGift } from "@/hooks/useGifts";
import { GiftWithContributions } from "@/types/gift";
import { Gift, Unlock } from "lucide-react";

interface ReserveDialogProps {
  gift: GiftWithContributions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReserveDialog({ gift, open, onOpenChange }: ReserveDialogProps) {
  const [name, setName] = useState("");
  const { toast } = useToast();
  const reserveGift = useReserveGift();
  const unreserveGift = useUnreserveGift();

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre nom", variant: "destructive" });
      return;
    }

    try {
      await reserveGift.mutateAsync({ id: gift.id, reservedBy: name.trim() });
      toast({ title: "Cadeau réservé ! 🎁", description: `Merci ${name} !` });
      setName("");
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleUnreserve = async () => {
    try {
      await unreserveGift.mutateAsync(gift.id);
      toast({ title: "Réservation annulée", description: "Le cadeau est à nouveau disponible" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  if (gift.reserved) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Cadeau déjà réservé</DialogTitle>
            <DialogDescription>
              Ce cadeau a été réservé par <strong>{gift.reserved_by}</strong>.
            </DialogDescription>
          </DialogHeader>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Unlock className="w-4 h-4 mr-2" />
                Libérer ce cadeau
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir libérer ce cadeau ? Il redeviendra disponible pour les autres.
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Réserver ce cadeau
          </DialogTitle>
          <DialogDescription>
            Réservez « {gift.title} » pour l'offrir
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReserve} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reserveName">Votre nom</Label>
            <Input
              id="reserveName"
              placeholder="Ex: Marie Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={reserveGift.isPending}
          >
            <Gift className="w-4 h-4 mr-2" />
            {reserveGift.isPending ? "Réservation..." : "Réserver ce cadeau"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
