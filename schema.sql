-- Run this in your Supabase SQL Editor

-- Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    ticket_number TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    tier TEXT,
    entries INTEGER DEFAULT 0,
    google_review BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can register)
CREATE POLICY "Allow public insert on participants"
    ON public.participants
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow public read/update for Admin dashboard access
CREATE POLICY "Allow public select on participants"
    ON public.participants
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public update on participants"
    ON public.participants
    FOR UPDATE
    TO public
    USING (true);
