export interface Gift {
  id: string;
  title: string;
  price: number | null;
  link: string | null;
  notes: string | null;
  images: string[];
  is_shared: boolean;
  target_amount: number | null;
  min_contribution: number | null;
  reserved: boolean;
  reserved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  gift_id: string;
  name: string;
  amount: number;
  payment_provider: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface GiftWithContributions extends Gift {
  contributions: Contribution[];
  total_contributed: number;
}
