import { useState } from "react";
import { useGifts, useDeleteGift } from "@/hooks/useGifts";
import { useAdmin } from "@/contexts/AdminContext";
import { GiftCard } from "./GiftCard";
import { GiftFormDialog } from "./GiftFormDialog";
import { GiftWithContributions } from "@/types/gift";
import { Loader2, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function GiftList() {
  const { data: gifts, isLoading, error } = useGifts();
  const { isAdmin } = useAdmin();
  const deleteGift = useDeleteGift();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "shared" | "reserved">("all");
  const [editingGift, setEditingGift] = useState<GiftWithContributions | null>(null);
  const [deletingGift, setDeletingGift] = useState<GiftWithContributions | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Erreur lors du chargement des cadeaux</p>
      </div>
    );
  }

  const filteredGifts = gifts?.filter((gift) => {
    const matchesSearch = gift.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filter) {
      case "available":
        return matchesSearch && !gift.reserved && !gift.is_shared;
      case "shared":
        return matchesSearch && gift.is_shared;
      case "reserved":
        return matchesSearch && gift.reserved;
      default:
        return matchesSearch;
    }
  });

  const handleDelete = async () => {
    if (!deletingGift) return;
    
    try {
      await deleteGift.mutateAsync(deletingGift.id);
      toast({ title: "Cadeau supprimé", description: "Le cadeau a été supprimé avec succès" });
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setDeletingGift(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un cadeau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cadeaux</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
            <SelectItem value="shared">Cagnottes</SelectItem>
            <SelectItem value="reserved">Réservés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filteredGifts && filteredGifts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGifts.map((gift) => (
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
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-xl text-muted-foreground">
            Aucun cadeau trouvé
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "Essayez avec d'autres termes" : "La liste est vide pour le moment"}
          </p>
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
      <AlertDialog open={!!deletingGift} onOpenChange={(open) => !open && setDeletingGift(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce cadeau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le cadeau « {deletingGift?.title} » et toutes ses contributions seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
