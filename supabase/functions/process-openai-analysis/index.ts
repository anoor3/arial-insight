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
    console.log(`Starting OpenAI analysis for run ${runId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get run data
    const { data: run, error: fetchError } = await supabase
      .from('analysis_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (fetchError || !run) {
      throw new Error(`Run not found: ${fetchError?.message}`);
    }

    // Check for cancellation
    if (run.cancel_requested) {
      await supabase
        .from('analysis_runs')
        .update({ status: 'cancelled', current_step: 'cancelled' })
        .eq('id', runId);
      return new Response(JSON.stringify({ success: false, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status
    await supabase
      .from('analysis_runs')
      .update({ 
        status: 'processing', 
        current_step: 'ai_analysis'
      })
      .eq('id', runId);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build the prompt for GPT-5
    const systemPrompt = `You are Roof Dynamics, a professional roof inspection assistant. Analyze the provided address and generate a comprehensive roof inspection report. Return ONLY valid JSON matching the exact schema provided. No additional text or formatting.`;

    const userPrompt = `Analyze this property address for a comprehensive roof inspection report: "${run.address}"

Based on typical construction patterns and regional building practices, provide a detailed analysis in the following JSON format:

{
  "summary": {
    "address": "${run.address}",
    "overall_risk": "low|medium|high",
    "notes": "Professional assessment summary"
  },
  "measurements": {
    "total_area_sqft": 0,
    "avg_pitch": "6/12",
    "ridge_length_ft": 0,
    "valley_length_ft": 0,
    "eaves_length_ft": 0
  },
  "planes": [
    {
      "id": "plane_1",
      "area_sqft": 0,
      "pitch": "6/12",
      "orientation_deg": 180,
      "polygon": [[0,0], [100,0], [100,50], [0,50]]
    }
  ],
  "materials": {
    "shingles_bundles": 0,
    "underlayment_sq": 0,
    "drip_edge_ft": 0,
    "flashing_ft": 0,
    "vents_count": 0
  },
  "risks": ["List of identified risks"],
  "maintenance": ["Recommended maintenance items"],
  "cost_breakdown": {
    "labor_usd": 0,
    "materials_usd": 0,
    "disposal_usd": 0,
    "contingency_usd": 0,
    "total_usd": 0
  },
  "permits": {
    "required": false,
    "notes": "Permit requirements analysis"
  }
}

Provide realistic estimates based on standard residential construction practices.`;

    console.log('Calling OpenAI API...');
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using available model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const analysisText = data.choices[0].message.content;
    let analysis;
    
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', analysisText);
      throw new Error('OpenAI returned invalid JSON');
    }

    // Store analysis in database
    const { error: updateError } = await supabase
      .from('analysis_runs')
      .update({ 
        analysis: analysis,
        current_step: 'analysis_complete',
        metadata: { 
          token_usage: data.usage || {},
          model_used: 'gpt-4o-mini'
        }
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Error updating run with analysis:', updateError);
      throw updateError;
    }

    console.log(`Successfully completed OpenAI analysis for run ${runId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        analysis: analysis,
        metadata: { token_usage: data.usage || {} }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-openai-analysis:', error);
    
    // Update run with error status
    try {
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
        .eq('id', req.json().then(body => body.runId));
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