import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, LogIn } from 'lucide-react';

interface AdminLoginProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AdminLogin({ open, onOpenChange }: AdminLoginProps) {
    const [password, setPassword] = useState('');
    const { login } = useAdmin();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (login(password)) {
            toast({
                title: 'Bienvenue ! 👋',
                description: "Vous êtes connecté en tant qu'administrateur",
            });
            setPassword('');
            onOpenChange(false);
        } else {
            toast({
                title: 'Erreur',
                description: 'Mot de passe incorrect',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='font-display flex items-center gap-2'>
                        <Lock className='w-5 h-5 text-primary' />
                        Connexion Admin
                    </DialogTitle>
                    <DialogDescription>
                        Entrez le mot de passe administrateur pour gérer les cadeaux
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className='space-y-4'
                >
                    <div className='space-y-2'>
                        <Label htmlFor='adminPassword'>Mot de passe</Label>
                        <Input
                            id='adminPassword'
                            type='password'
                            placeholder='••••••••'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type='submit'
                        className='w-full'
                    >
                        <LogIn className='w-4 h-4 mr-2' />
                        Se connecter
                    </Button>

                    {/* <p className="text-xs text-center text-muted-foreground">
            💡 Mot de passe démo : admin123
          </p> */}
                </form>
            </DialogContent>
        </Dialog>
    );
}
