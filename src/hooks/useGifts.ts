import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Contribution, GiftWithContributions } from '@/types/gift';
import { useEffect } from 'react';

export function useGifts() {
    console.log('✅ useGifts loaded');

    const queryClient = useQueryClient();

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('gifts-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, () => {
                queryClient.invalidateQueries({ queryKey: ['gifts'] });
            })
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contributions' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['gifts'] });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const giftsQuery = useQuery({
        queryKey: ['gifts'],
        queryFn: async (): Promise<GiftWithContributions[]> => {
            const { data: gifts, error: giftsError } = await supabase
                .from('gifts')
                .select('*')
                .order('created_at', { ascending: true });

            if (giftsError) throw giftsError;

            const { data: contributions, error: contribError } = await supabase
                .from('contributions')
                .select('*');

            if (contribError) throw contribError;

            return (gifts as Gift[]).map((gift) => {
                const giftContributions = (contributions as Contribution[]).filter(
                    (c) => c.gift_id === gift.id,
                );
                const total = giftContributions.reduce((sum, c) => sum + Number(c.amount), 0);
                return {
                    ...gift,
                    contributions: giftContributions,
                    total_contributed: total,
                };
            });
        },
    });

    return giftsQuery;
}

export function useCreateGift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (gift: Omit<Gift, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase.from('gifts').insert(gift).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}

export function useUpdateGift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Gift> & { id: string }) => {
            const { data, error } = await supabase
                .from('gifts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}

export function useDeleteGift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('gifts').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}

export function useAddContribution() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (contribution: Omit<Contribution, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('contributions')
                .insert(contribution)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}

export function useDeleteContribution() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('contributions').delete().eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}

export function useReserveGift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reservedBy }: { id: string; reservedBy: string }) => {
            const { data, error } = await supabase
                .from('gifts')
                .update({ reserved: true, reserved_by: reservedBy })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}

export function useUnreserveGift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('gifts')
                .update({ reserved: false, reserved_by: null })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gifts'] });
        },
    });
}
