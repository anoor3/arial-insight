import { supabase } from '@/integrations/supabase/client';

export interface AnalysisRun {
  id: string;
  address: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  cancel_requested: boolean;
  current_step?: string;
  imagery?: any;
  analysis?: any;
  pdf_url?: string;
  metadata?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export async function createAnalysisRun(address: string): Promise<AnalysisRun> {
  const { data, error } = await supabase
    .from('analysis_runs')
    .insert({ 
      address,
      status: 'queued',
      current_step: 'initializing'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create analysis run: ${error.message}`);
  }

  return data as AnalysisRun;
}

export async function getAnalysisRun(id: string): Promise<AnalysisRun | null> {
  const { data, error } = await supabase
    .from('analysis_runs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch analysis run: ${error.message}`);
  }

  return data as AnalysisRun | null;
}

export async function cancelAnalysisRun(id: string): Promise<void> {
  const { error } = await supabase
    .from('analysis_runs')
    .update({ cancel_requested: true })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to cancel analysis run: ${error.message}`);
  }
}

export async function startAnalysisPipeline(runId: string, address: string): Promise<void> {
  try {
    // First fetch satellite imagery
    const imageryResponse = await supabase.functions.invoke('fetch-satellite-imagery', {
      body: { runId, address }
    });

    if (imageryResponse.error) {
      throw new Error(`Imagery fetch failed: ${imageryResponse.error.message}`);
    }

    // Then start the full pipeline in the background
    const pipelineResponse = await supabase.functions.invoke('run-full-pipeline', {
      body: { runId }
    });

    if (pipelineResponse.error) {
      throw new Error(`Pipeline failed: ${pipelineResponse.error.message}`);
    }
  } catch (error) {
    console.error('Error starting analysis pipeline:', error);
    
    // Update run status to failed
    await supabase
      .from('analysis_runs')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        current_step: 'failed'
      })
      .eq('id', runId);
    
    throw error;
  }
}

export async function getAnalysisHistory(): Promise<AnalysisRun[]> {
  const { data, error } = await supabase
    .from('analysis_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch analysis history: ${error.message}`);
  }

  return (data || []) as AnalysisRun[];
}