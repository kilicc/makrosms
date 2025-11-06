-- RLS Politikaları: short_links tablosu için
-- Service key kullanıldığında RLS bypass edilir, ama yine de politikalar ekleyelim

-- short_links tablosu için RLS politikaları
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi kısa linklerini görebilir
CREATE POLICY "Users can view own short links" ON short_links
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Kullanıcılar kendi kısa linklerini oluşturabilir
CREATE POLICY "Users can insert own short links" ON short_links
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Kullanıcılar kendi kısa linklerini güncelleyebilir
CREATE POLICY "Users can update own short links" ON short_links
FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Kullanıcılar kendi kısa linklerini silebilir
CREATE POLICY "Users can delete own short links" ON short_links
FOR DELETE
USING (auth.uid()::text = user_id::text);

-- short_code ile herkes kısa linki görebilir (yönlendirme için)
CREATE POLICY "Anyone can view active short links by code" ON short_links
FOR SELECT
USING (is_active = true);

-- short_link_clicks tablosu için RLS politikaları
ALTER TABLE short_link_clicks ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi kısa linklerinin tıklamalarını görebilir
CREATE POLICY "Users can view clicks for own short links" ON short_link_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM short_links
    WHERE short_links.id = short_link_clicks.short_link_id
    AND short_links.user_id::text = auth.uid()::text
  )
);

-- Herkes tıklama kaydı oluşturabilir (yönlendirme için)
CREATE POLICY "Anyone can insert click records" ON short_link_clicks
FOR INSERT
WITH CHECK (true);

