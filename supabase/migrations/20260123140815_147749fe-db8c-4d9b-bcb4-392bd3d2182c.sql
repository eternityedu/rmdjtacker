-- Create storage bucket for house images
INSERT INTO storage.buckets (id, name, public)
VALUES ('house-images', 'house-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow house owners to upload images
CREATE POLICY "House owners can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'house-images' AND auth.uid() IS NOT NULL);

-- Allow public read access to house images
CREATE POLICY "Anyone can view house images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'house-images');

-- Allow house owners to delete their images
CREATE POLICY "House owners can delete their images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'house-images' AND auth.uid() IS NOT NULL);

-- Add area column to houses table
ALTER TABLE public.houses
ADD COLUMN IF NOT EXISTS area_sqft integer;

-- Add features/specialties column
ALTER TABLE public.houses
ADD COLUMN IF NOT EXISTS features text[];