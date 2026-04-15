-- Tabella per i preferiti dei buyer
-- Da eseguire su Supabase SQL Editor

-- Creazione tabella favorites
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un buyer può salvare un farmer solo una volta
    UNIQUE(user_id, farmer_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_farmer_id ON favorites(farmer_id);

-- Politiche RLS (Row Level Security)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo i propri preferiti
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: utenti possono inserire solo i propri preferiti
CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: utenti possono eliminare solo i propri preferiti
CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Tabella opzionale per tracciare i contatti (click WhatsApp)
CREATE TABLE IF NOT EXISTS contact_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'whatsapp',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_clicks_user_id ON contact_clicks(user_id);

ALTER TABLE contact_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact history" ON contact_clicks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert contact clicks" ON contact_clicks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
