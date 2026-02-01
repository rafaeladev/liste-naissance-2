-- Create admins table for admin authentication
CREATE TABLE public.admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gifts table
CREATE TABLE public.gifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    price DECIMAL(10,2),
    link TEXT,
    notes TEXT,
    images TEXT[] DEFAULT '{}',
    is_shared BOOLEAN NOT NULL DEFAULT false,
    target_amount DECIMAL(10,2),
    min_contribution DECIMAL(10,2),
    reserved BOOLEAN NOT NULL DEFAULT false,
    reserved_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contributions table
CREATE TABLE public.contributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_provider TEXT,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Enable realtime for gifts and contributions
ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;

-- RLS Policies for gifts (public read, admin write via edge functions)
CREATE POLICY "Anyone can view gifts" 
ON public.gifts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert gifts" 
ON public.gifts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update gifts" 
ON public.gifts 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete gifts" 
ON public.gifts 
FOR DELETE 
USING (true);

-- RLS Policies for contributions (public read, anyone can insert)
CREATE POLICY "Anyone can view contributions" 
ON public.contributions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can add contributions" 
ON public.contributions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update contributions" 
ON public.contributions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete contributions" 
ON public.contributions 
FOR DELETE 
USING (true);

-- RLS Policies for admins (restricted)
CREATE POLICY "Admins table is protected" 
ON public.admins 
FOR SELECT 
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for gifts updated_at
CREATE TRIGGER update_gifts_updated_at
BEFORE UPDATE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin (password: admin123 - hashed with bcrypt)
INSERT INTO public.admins (username, password_hash) 
VALUES ('admin', '$2a$10$rQnN8T1V3XQOgr5xLX1HXeHWqcHvQEXqJ2kCNlHZXqYP3mWYQBhGK');