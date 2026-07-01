-- 1. DROP EXISTING TABLES IF EXISTS
drop table if exists payments;
drop table if exists customers;

-- 2. CREATE TABLE: customers
create table customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  phone text not null,
  monthly_fee numeric not null,
  join_date date not null,
  status text not null default 'AKTIF' check (status in ('AKTIF', 'NONAKTIF')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE TABLE: payments
create table payments (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers(id) on delete cascade not null,
  period text not null, -- Format: YYYY-MM
  status text not null default 'N/A' check (status in ('LUNAS', 'KURANG', 'BELUM_BAYAR', 'N/A')),
  amount_paid numeric not null default 0,
  method text not null default 'Transfer Bank',
  transaction_date date,
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_customer_period unique (customer_id, period)
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
alter table customers enable row level security;
alter table payments enable row level security;

-- 5. RLS POLICIES FOR customers
-- Allow public select (read) so customers can view invoices via shareable links
create policy "Allow public read access for customers"
  on customers for select
  using (true);

-- Restrict insert, update, and delete to authenticated admin users
create policy "Allow admin write access for customers"
  on customers for all
  to authenticated
  using (true)
  with check (true);

-- 6. RLS POLICIES FOR payments
-- Allow public select (read) so customers can view payment histories on invoice pages
create policy "Allow public read access for payments"
  on payments for select
  using (true);

-- Restrict insert, update, and delete to authenticated admin users
create policy "Allow admin write access for payments"
  on payments for all
  to authenticated
  using (true)
  with check (true);

-- 7. INSERT DEFAULT MOCK DATA
-- We will insert customers first, then insert their corresponding payments.
-- Let's create specific UUIDs for testing consistency if desired, or let SQL generate them.
-- Here we insert the 9 customers matching the user's initial setup.
insert into customers (id, name, address, phone, monthly_fee, join_date, status) values
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Adit', 'Rungkut Kidul No. 12', '6281234567890', 100000, '2026-01-10', 'AKTIF'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Aqila', 'Medokan Ayu III A/4', '6282345678901', 100000, '2026-02-15', 'AKTIF'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Ari', 'Kedung Baruk No. 45', '6283456789012', 100000, '2026-01-20', 'AKTIF'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Bp. Wahyu', 'Penjaringan Sari Blok C/10', '6284567890123', 100000, '2026-03-01', 'AKTIF'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Gunawan', 'Gunung Anyar Emas No. 8', '6285678901234', 100000, '2026-01-05', 'AKTIF'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Intan', 'Rungkut Madya No. 88', '6286789012345', 100000, '2026-04-12', 'AKTIF'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', 'Risna', 'Wonorejo Indah No. 34', '6287890123456', 100000, '2026-01-15', 'AKTIF'),
  ('b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', 'Sri Wahyuti', 'Kedung Asem No. 17', '6288901234567', 80000, '2026-05-10', 'AKTIF'),
  ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', 'Sutar Jiyanto', 'Kali Rungkut No. 56', '6289012345678', 100000, '2026-02-01', 'AKTIF');

-- Insert historical payment records matching our initial state (Juni 2026 as current selected month)
-- Adit: Jan-Jun Lunas
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-01', 'LUNAS', 100000, 'Transfer Bank', '2026-01-25'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-02', 'LUNAS', 100000, 'Transfer Bank', '2026-02-25'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-03', 'LUNAS', 100000, 'Transfer Bank', '2026-03-25'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-04', 'LUNAS', 100000, 'Transfer Bank', '2026-04-25'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-05', 'LUNAS', 100000, 'Transfer Bank', '2026-05-25'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06', 'LUNAS', 100000, 'Transfer Bank', '2026-06-25');

-- Aqila: Feb-Jun Lunas (Joined Feb)
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '2026-02', 'LUNAS', 100000, 'Tunai / Cash', '2026-02-28'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '2026-03', 'LUNAS', 100000, 'Tunai / Cash', '2026-03-28'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '2026-04', 'LUNAS', 100000, 'Tunai / Cash', '2026-04-28'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '2026-05', 'LUNAS', 100000, 'Tunai / Cash', '2026-05-28'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '2026-06', 'LUNAS', 100000, 'Tunai / Cash', '2026-06-28');

-- Ari: Jan-Jun Lunas
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '2026-01', 'LUNAS', 100000, 'Transfer Bank', '2026-01-26'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '2026-02', 'LUNAS', 100000, 'Transfer Bank', '2026-02-26'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '2026-03', 'LUNAS', 100000, 'Transfer Bank', '2026-03-26'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '2026-04', 'LUNAS', 100000, 'Transfer Bank', '2026-04-26'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '2026-05', 'LUNAS', 100000, 'Transfer Bank', '2026-05-26'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '2026-06', 'LUNAS', 100000, 'Transfer Bank', '2026-06-26');

-- Bp. Wahyu: Mar-Jun Lunas (Joined Mar)
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', '2026-03', 'LUNAS', 100000, 'Transfer Bank', '2026-03-27'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', '2026-04', 'LUNAS', 100000, 'Transfer Bank', '2026-04-27'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', '2026-05', 'LUNAS', 100000, 'Transfer Bank', '2026-05-27'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', '2026-06', 'LUNAS', 100000, 'Transfer Bank', '2026-06-27');

-- Gunawan: Jan-Jun Lunas
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '2026-01', 'LUNAS', 100000, 'E-Wallet', '2026-01-25'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '2026-02', 'LUNAS', 100000, 'E-Wallet', '2026-02-25'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '2026-03', 'LUNAS', 100000, 'E-Wallet', '2026-03-25'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '2026-04', 'LUNAS', 100000, 'E-Wallet', '2026-04-25'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '2026-05', 'LUNAS', 100000, 'E-Wallet', '2026-05-25'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '2026-06', 'LUNAS', 100000, 'E-Wallet', '2026-06-25');

-- Intan: Apr-May Lunas, Jun BELUM_BAYAR (Joined Apr)
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', '2026-04', 'LUNAS', 100000, 'Transfer Bank', '2026-04-29'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', '2026-05', 'LUNAS', 100000, 'Transfer Bank', '2026-05-29'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', '2026-06', 'BELUM_BAYAR', 0, 'Transfer Bank', null);

-- Risna: Jan-Jun Lunas
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '2026-01', 'LUNAS', 100000, 'Transfer Bank', '2026-01-25'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '2026-02', 'LUNAS', 100000, 'Transfer Bank', '2026-02-25'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '2026-03', 'LUNAS', 100000, 'Transfer Bank', '2026-03-25'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '2026-04', 'LUNAS', 100000, 'Transfer Bank', '2026-04-25'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '2026-05', 'LUNAS', 100000, 'Transfer Bank', '2026-05-25'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '2026-06', 'LUNAS', 100000, 'Transfer Bank', '2026-06-25');

-- Sri Wahyuti: May Lunas, Jun Lunas (Tariff 80000, Joined May)
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', '2026-05', 'LUNAS', 80000, 'Tunai / Cash', '2026-05-15'),
  ('b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', '2026-06', 'LUNAS', 80000, 'Tunai / Cash', '2026-06-15');

-- Sutar Jiyanto: Feb-Apr Lunas, May BELUM_BAYAR, Jun BELUM_BAYAR (Joined Feb)
insert into payments (customer_id, period, status, amount_paid, method, transaction_date) values
  ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', '2026-02', 'LUNAS', 100000, 'Transfer Bank', '2026-02-28'),
  ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', '2026-03', 'LUNAS', 100000, 'Transfer Bank', '2026-03-28'),
  ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', '2026-04', 'LUNAS', 100000, 'Transfer Bank', '2026-04-28'),
  ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', '2026-05', 'BELUM_BAYAR', 0, 'Transfer Bank', null),
  ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', '2026-06', 'BELUM_BAYAR', 0, 'Transfer Bank', null);

-- 8. INSERT ADMIN USER ACCOUNT FOR SUPABASE AUTH
-- email: arif.setiawan2209@gmail.com
-- password: palamana
-- This SQL hashes the password and registers the user directly as active/confirmed.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
  'authenticated',
  'authenticated',
  'arif.setiawan2209@gmail.com',
  crypt('palamana', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  gen_random_uuid(),
  'a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
  '{"sub":"a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d","email":"arif.setiawan2209@gmail.com"}',
  'email',
  null,
  now(),
  now()
);
