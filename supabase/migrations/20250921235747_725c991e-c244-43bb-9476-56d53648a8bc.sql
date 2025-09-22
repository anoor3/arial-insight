-- Create analysis_runs table for roof analysis pipeline
CREATE TABLE public.analysis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  cancel_requested BOOLEAN NOT NULL DEFAULT false,
  current_step TEXT,
  imagery JSONB,
  analysis JSONB,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a demo app)
CREATE POLICY "Allow public read access to analysis_runs" 
ON public.analysis_runs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to analysis_runs" 
ON public.analysis_runs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to analysis_runs" 
ON public.analysis_runs 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analysis_runs_updated_at
BEFORE UPDATE ON public.analysis_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for reports bucket
CREATE POLICY "Public read access to reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'reports');

CREATE POLICY "Public upload to reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'reports');

-- Add index for better performance
CREATE INDEX idx_analysis_runs_status ON public.analysis_runs(status);
CREATE INDEX idx_analysis_runs_created_at ON public.analysis_runs(created_at DESC);