import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runId } = await req.json();
    console.log(`Starting full pipeline orchestration for run ${runId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper function to check for cancellation
    async function checkCancellation(runId: string): Promise<boolean> {
      const { data } = await supabase
        .from('analysis_runs')
        .select('cancel_requested')
        .eq('id', runId)
        .single();
      
      return data?.cancel_requested || false;
    }

    // Helper function to call other edge functions
    async function callEdgeFunction(functionName: string, payload: any) {
      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${functionName} failed: ${response.status} ${errorText}`);
      }

      return response.json();
    }

    // Step 1: Check for cancellation before starting
    if (await checkCancellation(runId)) {
      await supabase
        .from('analysis_runs')
        .update({ status: 'cancelled', current_step: 'cancelled' })
        .eq('id', runId);
      console.log(`Run ${runId} was cancelled before processing`);
      return new Response(JSON.stringify({ success: false, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Step 1: Starting OpenAI analysis for run ${runId}`);
    
    // Step 2: Process OpenAI Analysis
    const analysisResult = await callEdgeFunction('process-openai-analysis', { runId });
    
    if (!analysisResult.success) {
      if (analysisResult.cancelled) {
        console.log(`Run ${runId} was cancelled during OpenAI analysis`);
        return new Response(JSON.stringify({ success: false, cancelled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`OpenAI analysis failed: ${analysisResult.error}`);
    }

    // Step 3: Check for cancellation after analysis
    if (await checkCancellation(runId)) {
      await supabase
        .from('analysis_runs')
        .update({ status: 'cancelled', current_step: 'cancelled' })
        .eq('id', runId);
      console.log(`Run ${runId} was cancelled after OpenAI analysis`);
      return new Response(JSON.stringify({ success: false, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Step 2: Starting PDF generation for run ${runId}`);
    
    // Step 4: Generate PDF Report
    const pdfResult = await callEdgeFunction('generate-pdf-report', { runId });
    
    if (!pdfResult.success) {
      if (pdfResult.cancelled) {
        console.log(`Run ${runId} was cancelled during PDF generation`);
        return new Response(JSON.stringify({ success: false, cancelled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`PDF generation failed: ${pdfResult.error}`);
    }

    // Step 5: Mark run as completed
    const { error: completionError } = await supabase
      .from('analysis_runs')
      .update({ 
        status: 'completed',
        current_step: 'completed'
      })
      .eq('id', runId);

    if (completionError) {
      console.error('Error marking run as completed:', completionError);
      throw completionError;
    }

    console.log(`Successfully completed full pipeline for run ${runId}`);

    return new Response(JSON.stringify({ 
      success: true,
      runId: runId,
      pdfUrl: pdfResult.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in run-full-pipeline:', error);
    
    // Update run with error status
    try {
      const { runId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('analysis_runs')
        .update({ 
          status: 'failed',
          error_message: error.message,
          current_step: 'failed'
        })
        .eq('id', runId);
    } catch (dbError) {
      console.error('Failed to update run with error status:', dbError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});