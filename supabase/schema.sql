-- ==============================================================================
-- Supabase Schema for Khatabook / Personal Ledger App
-- Multi-device Personal Ledger with Row Level Security (RLS)
-- ==============================================================================

-- 1. PROFILES TABLE (Associated with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PEOPLE TABLE (Ledger contacts for each user)
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TRANSACTIONS TABLE (Money given or received with people)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('gave', 'received')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL DEFAULT '',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_settlement BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. EXPENSES TABLE (Personal expenses and out-of-pocket spending)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. EXPENSE SPLITS TABLE (Multi-person shared expense records)
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_people_user_id ON public.people(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_person_id ON public.transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES FOR PROFILES
-- ==============================================================================
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==============================================================================
-- RLS POLICIES FOR PEOPLE
-- ==============================================================================
CREATE POLICY "Users can view their own people"
  ON public.people FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own people"
  ON public.people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own people"
  ON public.people FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own people"
  ON public.people FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS POLICIES FOR TRANSACTIONS
-- ==============================================================================
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS POLICIES FOR EXPENSES
-- ==============================================================================
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS POLICIES FOR EXPENSE SPLITS
-- ==============================================================================
CREATE POLICY "Users can view their own expense splits"
  ON public.expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE public.expenses.id = public.expense_splits.expense_id
      AND public.expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own expense splits"
  ON public.expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE public.expenses.id = public.expense_splits.expense_id
      AND public.expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own expense splits"
  ON public.expense_splits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE public.expenses.id = public.expense_splits.expense_id
      AND public.expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own expense splits"
  ON public.expense_splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE public.expenses.id = public.expense_splits.expense_id
      AND public.expenses.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute after a new auth.users row is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
