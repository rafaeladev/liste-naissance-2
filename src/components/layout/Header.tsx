import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { GiftFormDialog } from '@/components/gift/GiftFormDialog';
import { Gift, Lock, LogOut, Plus, Sparkles } from 'lucide-react';

export function Header() {
    const { isAdmin, logout } = useAdmin();
    const [showLogin, setShowLogin] = useState(false);
    const [showAddGift, setShowAddGift] = useState(false);

    return (
        <>
            <header className='sticky top-0 z-40 backdrop-blur-md border-b border-primary '>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        {/* Logo & Title */}
                        <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 rounded-full flex items-center justify-center shadow-soft'>
                                <img
                                    src='/images/illus/soleil.png'
                                    alt='Bébé Oliveira Menguy'
                                    className='w-12 h-12 rounded-2xl  object-cover'
                                />
                            </div>
                            <div>
                                <h1 className='font-display text-xl font-bold'>Oliveira Menguy</h1>
                                <p className='text-xs text-muted-foreground flex items-center gap-1'>
                                    <Sparkles className='w-3 h-3' />
                                    Bienvenue !
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                            {isAdmin ? (
                                <>
                                    <Button
                                        onClick={() => setShowAddGift(true)}
                                        className='gradient-primary text-primary-foreground'
                                    >
                                        <Plus className='w-4 h-4 mr-2' />
                                        <span className='hidden sm:inline'>Ajouter un cadeau</span>
                                        <span className='sm:hidden'>Ajouter</span>
                                    </Button>
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        onClick={logout}
                                    >
                                        <LogOut className='w-4 h-4' />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setShowLogin(true)}
                                >
                                    <Lock className='w-4 h-4 mr-2' />
                                    Admin
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Dialogs */}
            <AdminLogin
                open={showLogin}
                onOpenChange={setShowLogin}
            />
            <GiftFormDialog
                open={showAddGift}
                onOpenChange={setShowAddGift}
            />
        </>
    );
}
