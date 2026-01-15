-- 1. PERSIAPAN: Extensions & Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. FUNGSI HELPER: Otomatis Update Waktu (updated_at)
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;   
END;
$$ LANGUAGE plpgsql;

-- 3. TABEL UTAMA: Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    coins integer DEFAULT 10 NOT NULL,
    api_key uuid DEFAULT gen_random_uuid() NOT NULL,
    total_processed integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. TABEL KEAMANAN: User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- 5. TABEL PENGATURAN: Payment & Coin Packages
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coin_amount integer NOT NULL,
  price integer NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. TABEL TRANSAKSI: Coin Transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES public.coin_packages(id),
  order_id text UNIQUE NOT NULL,
  amount integer NOT NULL,
  coin_amount integer NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  midtrans_transaction_id text,
  payment_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. TABEL OPERASIONAL: API Actions & History
CREATE TABLE IF NOT EXISTS public.api_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action_key text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    coin_cost integer DEFAULT 2 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    category text DEFAULT 'general',
    endpoint_config jsonb DEFAULT '{}'::jsonb,
    input_schema jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.video_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_url text NOT NULL,
    processed_url text,
    status text DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 8. SISTEM OTOMATIS: Trigger User Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, coins)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user_'||substr(NEW.id::text, 1, 8)),
    10 -- Koin Gratis
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ATURAN KEAMANAN (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 10. ISI DATA AWAL (Optional)
INSERT INTO public.payment_settings (setting_key, setting_value) VALUES
  ('midtrans_server_key', 'GANTI_DENGAN_SERVER_KEY'),
  ('midtrans_client_key', 'GANTI_DENGAN_CLIENT_KEY'),
  ('midtrans_mode', 'sandbox')
ON CONFLICT (setting_key) DO NOTHING;

