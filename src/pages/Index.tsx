import { AdminProvider } from '@/contexts/AdminContext';
import { Header } from '@/components/layout/Header';
import { GiftList } from '@/components/gift/GiftList';
import { Heart, Users, Gift, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { FreeDonationDialog } from '@/components/gift/FreeDonationDialog';
const Index = () => {
    const [showFreeDonation, setShowFreeDonation] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setShowScrollTop(window.scrollY > 600); // seuil: 600px (ajustable)
        };

        onScroll(); // initialise
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AdminProvider>
            <div className='min-h-screen bg-background relative'>
                <img
                    src='/images/illus/wave-haikei-3.svg'
                    alt='pattern background'
                    className='absolute inset-0 top-0 w-full h-80 object-cover'
                />
                <Header />

                {/* Hero Section */}
                <section className='relative overflow-hidden py-12 sm:py-16'>
                    <img
                        src='/images/illus/hiro.png'
                        alt='pattern background'
                        className='absolute inset-0 top-0 w-full h-full object-cover z-0'
                    />
                    <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10' />
                    <div className='container mx-auto px-4 relative'>
                        <div className='text-center max-w-2xl mx-auto'>
                            <div className='mb-6 flex justify-center'>
                                <img
                                    src='/images/illus/canardpng.png'
                                    alt='Bébé Oliveira Menguy'
                                    className='w-48 sm:w-64 max-w-md rounded-2xl  object-cover animate-float-gentle'
                                />
                            </div>
                            <h2 className='font-display text-3xl sm:text-4xl font-bold mb-4 animate-fade-in'>
                                Liste de naissance Oliveira Menguy
                            </h2>
                            <p className='text-lg text-muted-foreground mb-8 animate-fade-in'>
                                Découvrez les cadeaux que nous aimerions recevoir. Vous pouvez
                                réserver un cadeau ou participer à une cagnotte collective.
                            </p>

                            {/* Stats */}
                            <div className='grid grid-cols-3 gap-4 max-w-md mx-auto animate-slide-up'>
                                <Button
                                    asChild
                                    variant='tertiary'
                                    className='h-auto p-4 rounded-xl shadow-soft'
                                >
                                    <a
                                        href='#cadeaux'
                                        className='flex flex-col items-center justify-center  gap-0'
                                    >
                                        <Gift className='w-6 h-6 mx-auto text-primary mb-2' />
                                        <p className='font-display font-bold text-xl'>Cadeaux</p>
                                        <p className='text-xs text-muted-foreground'>à découvrir</p>
                                    </a>
                                </Button>

                                <Button
                                    asChild
                                    variant='tertiary'
                                    className='h-auto p-4 rounded-xl shadow-soft'
                                >
                                    <a
                                        href='#cadeaux'
                                        className='flex flex-col items-center justify-center  gap-0'
                                    >
                                        <Users className='w-6 h-6 mx-auto text-secondary-foreground mb-2' />
                                        <p className='font-display font-bold text-xl'>Cagnottes</p>
                                        <p className='text-xs text-muted-foreground'>partagées</p>
                                    </a>
                                </Button>

                                <Button
                                    asChild
                                    variant='tertiary'
                                    className='h-auto p-4 rounded-xl shadow-soft'
                                >
                                    <a
                                        href='#merci'
                                        className='flex flex-col items-center justify-center  gap-0'
                                    >
                                        <Heart className='w-6 h-6 mx-auto text-destructive mb-2' />
                                        <p className='font-display font-bold text-xl'>Merci</p>
                                        <p className='text-xs text-muted-foreground'>pour tout !</p>
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gift List */}
                <main
                    id='cadeaux'
                    className='container mx-auto px-4 pb-16 mt-8'
                >
                    <GiftList />
                </main>

                {/* Merci Section */}
                <section
                    id='merci'
                    className='relative overflow-hidden bg-transparent'
                >
                    {/* wave en haut */}
                    {/* <img
                        src='/images/illus/session-top-3.png'
                        alt=''
                        className='
    pointer-events-none select-none absolute top-0 left-0 w-full z-0
    h-[100px] sm:h-[140px] md:h-[250px]
    object-cover object-center
  '
                    /> */}
                    {/* contenu (on pousse vers le bas pour ne pas passer sous la vague) */}
                    <div className='relative z-10   '>
                        <div className=' px-4 bg-accent2 h-full pb-16 pt-16 w-full'>
                            <div className='text-center max-w-3xl mx-auto'>
                                <div className='mb-6 flex justify-center'>
                                    <img
                                        src='/images/illus/group.png'
                                        alt='Bébé Oliveira Menguy'
                                        className='w-64 sm:w-80 lg:w-96 max-w-md object-cover'
                                    />
                                </div>

                                <h2 className='font-display text-3xl sm:text-4xl font-bold mb-4 animate-fade-in'>
                                    Merci de faire partie de cette aventure !
                                </h2>

                                <p className='text-lg text-muted-foreground mb-8 animate-fade-in'>
                                    Votre soutien et votre amour signifient le monde pour nous. Si
                                    vous voulez, vous pouvez aussi faire un don.
                                </p>

                                <div className='flex justify-center max-w-sm mx-auto animate-slide-up'>
                                    <Button
                                        onClick={() => setShowFreeDonation(true)}
                                        className='flex-1 gradient-primary text-primary-foreground hover:scale-105 transition-transform'
                                    >
                                        <Gift className='w-4 h-4 mr-2' />
                                        Faire un don
                                    </Button>

                                    <FreeDonationDialog
                                        open={showFreeDonation}
                                        onOpenChange={setShowFreeDonation}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {showScrollTop && (
                    <Button
                        type='button'
                        onClick={scrollToTop}
                        variant='outline'
                        size='icon'
                        aria-label='Revenir en haut'
                        className='fixed bottom-6 right-6 z-50 rounded-full shadow-md'
                    >
                        <ArrowUp className='h-5 w-5' />
                    </Button>
                )}

                {/* Footer */}
                <footer className='relative overflow-hidden bg-accent2'>
                    {/* wave en haut */}
                    {/* <img
                        src='/images/illus/session-top-2.png'
                        alt=''
                        className=' pointer-events-none select-none absolute top-0 left-0 w-full z-0
    h-[100px] sm:h-[140px] md:h-[250px]
    object-cover object-center'
                    /> */}

                    {/* contenu (on pousse vers le bas pour ne pas passer sous la vague) */}
                    <div className='relative z-10 text-center '>
                        <p className='text-sm text-muted-foreground flex items-center justify-center gap-2 bg-primary w-100 p-4'>
                            Fait avec <Heart className='w-3 h-3 text-destructive' /> par notre
                            famille
                            <img
                                src='/images/illus/soleil.png'
                                alt='Bébé Oliveira Menguy'
                                className='w-12 h-12 rounded-2xl object-cover'
                            />
                        </p>
                    </div>
                </footer>
            </div>
        </AdminProvider>
    );
};

export default Index;
