import { supabase } from '@/integrations/supabase/client';

type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AnalysisRun {
  id: string;
  address: string;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;
  current_step?: string | null;
  error_message?: string | null;
  pdf_url?: string | null;
  user_id: string;
  imagery?: any;
  analysis?: any;
  metadata?: any;
  cancel_requested: boolean;
}

export const createAnalysisRun = async (address: string): Promise<{ data: AnalysisRun | null; error: any }> => {
  const { data, error } = await supabase
    .from('analysis_runs')
    .insert([
      {
        address,
        status: 'queued',
        user_id: (await supabase.auth.getUser()).data.user?.id
      }
    ])
    .select()
    .single();

  return { data: data as AnalysisRun, error };
};

export const getAnalysisRuns = async (): Promise<{ data: AnalysisRun[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('analysis_runs')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data as AnalysisRun[], error };
};

export const getAnalysisRun = async (id: string): Promise<{ data: AnalysisRun | null; error: any }> => {
  const { data, error } = await supabase
    .from('analysis_runs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return { data: data as AnalysisRun, error };
};

export const updateAnalysisRun = async (id: string, updates: Partial<AnalysisRun>): Promise<{ data: AnalysisRun | null; error: any }> => {
  const { data, error } = await supabase
    .from('analysis_runs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as AnalysisRun, error };
};

export const cancelAnalysisRun = async (id: string): Promise<{ data: AnalysisRun | null; error: any }> => {
  const { data, error } = await supabase
    .from('analysis_runs')
    .update({ cancel_requested: true })
    .eq('id', id)
    .select()
    .single();

  return { data: data as AnalysisRun, error };
};