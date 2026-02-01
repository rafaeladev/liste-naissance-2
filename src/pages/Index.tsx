import { AdminProvider } from "@/contexts/AdminContext";
import { Header } from "@/components/layout/Header";
import { GiftList } from "@/components/gift/GiftList";
import { Heart, Users, Gift } from "lucide-react";

const Index = () => {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 animate-fade-in">
                Bienvenue sur notre liste de cadeaux
              </h2>
              <p className="text-lg text-muted-foreground mb-8 animate-fade-in">
                Découvrez les cadeaux que nous aimerions recevoir. 
                Vous pouvez réserver un cadeau ou participer à une cagnotte collective.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto animate-slide-up">
                <div className="p-4 bg-card rounded-xl shadow-soft">
                  <Gift className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="font-display font-bold text-xl">Cadeaux</p>
                  <p className="text-xs text-muted-foreground">à découvrir</p>
                </div>
                <div className="p-4 bg-card rounded-xl shadow-soft">
                  <Users className="w-6 h-6 mx-auto text-secondary-foreground mb-2" />
                  <p className="font-display font-bold text-xl">Cagnottes</p>
                  <p className="text-xs text-muted-foreground">partagées</p>
                </div>
                <div className="p-4 bg-card rounded-xl shadow-soft">
                  <Heart className="w-6 h-6 mx-auto text-destructive mb-2" />
                  <p className="font-display font-bold text-xl">Merci</p>
                  <p className="text-xs text-muted-foreground">pour tout !</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gift List */}
        <main className="container mx-auto px-4 pb-16">
          <GiftList />
        </main>

        {/* Footer */}
        <footer className="border-t py-8 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Fait avec <Heart className="w-3 h-3 inline text-destructive" /> pour notre famille
            </p>
          </div>
        </footer>
      </div>
    </AdminProvider>
  );
};

export default Index;
