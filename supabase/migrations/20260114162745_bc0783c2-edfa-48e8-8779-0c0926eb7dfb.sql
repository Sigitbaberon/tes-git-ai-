-- Create payment_settings table for Midtrans configuration
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payment settings
CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can read settings (needed for client key)
CREATE POLICY "Authenticated users can read payment settings"
  ON public.payment_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create coin_packages table
CREATE TABLE public.coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coin_amount integer NOT NULL,
  price integer NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;

-- Only admins can manage coin packages
CREATE POLICY "Admins can manage coin packages"
  ON public.coin_packages
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active coin packages
CREATE POLICY "Anyone can view active coin packages"
  ON public.coin_packages
  FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_coin_packages_updated_at
  BEFORE UPDATE ON public.coin_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create coin_transactions table for tracking purchases
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.coin_packages(id),
  order_id text UNIQUE NOT NULL,
  amount integer NOT NULL,
  coin_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  midtrans_transaction_id text,
  payment_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.coin_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.coin_transactions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all transactions
CREATE POLICY "Admins can manage transactions"
  ON public.coin_transactions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_coin_transactions_updated_at
  BEFORE UPDATE ON public.coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Midtrans settings
INSERT INTO public.payment_settings (setting_key, setting_value) VALUES
  ('midtrans_server_key', ''),
  ('midtrans_client_key', ''),
  ('midtrans_mode', 'sandbox');

-- Insert sample coin packages
INSERT INTO public.coin_packages (name, coin_amount, price, description, sort_order) VALUES
  ('Starter Pack', 50, 25000, '50 koin untuk mencoba layanan', 1),
  ('Basic Pack', 100, 45000, '100 koin dengan diskon 10%', 2),
  ('Pro Pack', 250, 100000, '250 koin dengan diskon 20%', 3),
  ('Enterprise Pack', 500, 175000, '500 koin dengan diskon 30%', 4);