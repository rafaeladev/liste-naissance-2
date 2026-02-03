import { AdminProvider } from '@/contexts/AdminContext';
import { Header } from '@/components/layout/Header';
import { GiftList } from '@/components/gift/GiftList';
import { Heart, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { FreeDonationDialog } from '@/components/gift/FreeDonationDialog';
const Index = () => {
    const [showFreeDonation, setShowFreeDonation] = useState(false);
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
                                <div className='p-4 bg-card rounded-xl shadow-soft'>
                                    <Gift className='w-6 h-6 mx-auto text-primary mb-2' />
                                    <p className='font-display font-bold text-xl'>Cadeaux</p>
                                    <p className='text-xs text-muted-foreground'>à découvrir</p>
                                </div>
                                <div className='p-4 bg-card rounded-xl shadow-soft'>
                                    <Users className='w-6 h-6 mx-auto text-secondary-foreground mb-2' />
                                    <p className='font-display font-bold text-xl'>Cagnottes</p>
                                    <p className='text-xs text-muted-foreground'>partagées</p>
                                </div>
                                <div className='p-4 bg-card rounded-xl shadow-soft'>
                                    <Heart className='w-6 h-6 mx-auto text-destructive mb-2' />
                                    <p className='font-display font-bold text-xl'>Merci</p>
                                    <p className='text-xs text-muted-foreground'>pour tout !</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gift List */}
                <main className='container mx-auto px-4 pb-16 mt-8'>
                    <GiftList />
                </main>

                <section className='relative overflow-hidden py-12 sm:py-16 h-[498px] '>
                    <img
                        src='/images/illus/session-top.png'
                        alt='pattern background'
                        className='absolute -top-0 left-0 w-full h-[216px] object-cover z-0 pointer-events-none'
                    />
                    {/* <img
                        src='/images/illus/session-bot.png'
                        alt='pattern background'
                        className='absolute -bottom-0 left-0 w-full h-[282px] object-cover z-0 pointer-events-none'
                    /> */}
                    <div className=' w-full relative bg-accent2 padding-bottom-8 pt-24 pb-16'>
                        <div className='container mx-auto px-4 relative '>
                            <div className='text-center max-w-3xl mx-auto my-auto mt-4'>
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

                {/* Footer */}
                <footer className='relative min-h-[300px] overflow-hidden bg-accent2 flex items-center justify-center'>
                    {/* background image */}
                    <img
                        src='/images/illus/session-top-2.png'
                        alt='pattern background'
                        className='absolute bottom-0 left-0 w-full h-[266px] object-cover z-0 pointer-events-none'
                    />

                    {/* centered content */}
                    <div className='relative z-10 text-center px-4'>
                        <p className='text-sm text-muted-foreground flex items-center justify-center gap-2 mt-32'>
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
