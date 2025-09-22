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
    console.log(`Starting PDF generation for run ${runId}`);

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
        current_step: 'generating_pdf'
      })
      .eq('id', runId);

    if (!run.analysis) {
      throw new Error('No analysis data found for PDF generation');
    }

    // Generate HTML content for the PDF
    const analysis = run.analysis;
    const htmlContent = generateReportHTML(analysis, run.address);

    // For now, we'll create a simple text-based PDF using a basic approach
    // In a real implementation, you would use a proper PDF generation library
    const pdfFileName = `roof-report-${runId}.pdf`;
    
    // Create a simple PDF-like content (this is a simplified approach)
    // In production, you'd want to use a proper PDF library
    const pdfContent = createSimplePDF(analysis, run.address);
    const pdfBuffer = new TextEncoder().encode(pdfContent);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('reports')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'text/plain', // In real implementation, this would be 'application/pdf'
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('reports')
      .getPublicUrl(pdfFileName);

    const pdfUrl = urlData.publicUrl;

    // Update run with PDF URL
    const { error: updateError } = await supabase
      .from('analysis_runs')
      .update({ 
        pdf_url: pdfUrl,
        current_step: 'pdf_complete'
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Error updating run with PDF URL:', updateError);
      throw updateError;
    }

    console.log(`Successfully generated PDF for run ${runId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      url: pdfUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pdf-report:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateReportHTML(analysis: any, address: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Roof Inspection Report - ${address}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Professional Roof Inspection Report</h1>
        <h2>${address}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <h3>Summary</h3>
        <p><strong>Overall Risk:</strong> ${analysis.summary?.overall_risk || 'N/A'}</p>
        <p><strong>Notes:</strong> ${analysis.summary?.notes || 'N/A'}</p>
      </div>

      <div class="section">
        <h3>Measurements</h3>
        <table class="table">
          <tr><th>Measurement</th><th>Value</th></tr>
          <tr><td>Total Area</td><td>${analysis.measurements?.total_area_sqft || 0} sq ft</td></tr>
          <tr><td>Average Pitch</td><td>${analysis.measurements?.avg_pitch || 'N/A'}</td></tr>
          <tr><td>Ridge Length</td><td>${analysis.measurements?.ridge_length_ft || 0} ft</td></tr>
          <tr><td>Valley Length</td><td>${analysis.measurements?.valley_length_ft || 0} ft</td></tr>
          <tr><td>Eaves Length</td><td>${analysis.measurements?.eaves_length_ft || 0} ft</td></tr>
        </table>
      </div>

      <div class="section">
        <h3>Cost Breakdown</h3>
        <table class="table">
          <tr><th>Item</th><th>Cost</th></tr>
          <tr><td>Labor</td><td>$${analysis.cost_breakdown?.labor_usd?.toLocaleString() || '0'}</td></tr>
          <tr><td>Materials</td><td>$${analysis.cost_breakdown?.materials_usd?.toLocaleString() || '0'}</td></tr>
          <tr><td>Disposal</td><td>$${analysis.cost_breakdown?.disposal_usd?.toLocaleString() || '0'}</td></tr>
          <tr><td>Contingency</td><td>$${analysis.cost_breakdown?.contingency_usd?.toLocaleString() || '0'}</td></tr>
          <tr><th>Total</th><th>$${analysis.cost_breakdown?.total_usd?.toLocaleString() || '0'}</th></tr>
        </table>
      </div>

      <div class="section">
        <h3>Identified Risks</h3>
        <ul>
          ${analysis.risks?.map((risk: string) => `<li>${risk}</li>`).join('') || '<li>No risks identified</li>'}
        </ul>
      </div>

      <div class="section">
        <h3>Maintenance Recommendations</h3>
        <ul>
          ${analysis.maintenance?.map((item: string) => `<li>${item}</li>`).join('') || '<li>No maintenance items</li>'}
        </ul>
      </div>
    </body>
    </html>
  `;
}

function createSimplePDF(analysis: any, address: string): string {
  return `
ROOF INSPECTION REPORT
======================

Property Address: ${address}
Report Date: ${new Date().toLocaleDateString()}
Generated by: Roof Dynamics AI Analysis

SUMMARY
-------
Overall Risk Level: ${analysis.summary?.overall_risk?.toUpperCase() || 'UNKNOWN'}
Notes: ${analysis.summary?.notes || 'No additional notes'}

MEASUREMENTS
------------
Total Roof Area: ${analysis.measurements?.total_area_sqft || 0} square feet
Average Pitch: ${analysis.measurements?.avg_pitch || 'Unknown'}
Ridge Length: ${analysis.measurements?.ridge_length_ft || 0} feet
Valley Length: ${analysis.measurements?.valley_length_ft || 0} feet
Eaves Length: ${analysis.measurements?.eaves_length_ft || 0} feet

COST BREAKDOWN
--------------
Labor Cost: $${analysis.cost_breakdown?.labor_usd?.toLocaleString() || '0'}
Materials Cost: $${analysis.cost_breakdown?.materials_usd?.toLocaleString() || '0'}
Disposal Cost: $${analysis.cost_breakdown?.disposal_usd?.toLocaleString() || '0'}
Contingency: $${analysis.cost_breakdown?.contingency_usd?.toLocaleString() || '0'}
TOTAL ESTIMATED COST: $${analysis.cost_breakdown?.total_usd?.toLocaleString() || '0'}

IDENTIFIED RISKS
----------------
${analysis.risks?.map((risk: string, index: number) => `${index + 1}. ${risk}`).join('\n') || 'No risks identified'}

MAINTENANCE RECOMMENDATIONS
---------------------------
${analysis.maintenance?.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n') || 'No maintenance recommendations'}

PERMIT REQUIREMENTS
-------------------
Permits Required: ${analysis.permits?.required ? 'YES' : 'NO'}
Notes: ${analysis.permits?.notes || 'No permit notes available'}

---
This report was generated using AI analysis and should be reviewed by a qualified professional.
For questions or concerns, please contact Roof Dynamics support.
  `.trim();
}