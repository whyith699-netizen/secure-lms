-- Add kas_paid and notes to attendance table
alter table public.attendance add column if not exists kas_paid boolean default false;
alter table public.attendance add column if not exists notes text default '';
