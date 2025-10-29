import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    console.log('Fetching profit & loss by project for company:', companyId);

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get token
    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('access_token, realm_id')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('QuickBooks token not found');
    }

    // Query QuickBooks for profit and loss by class (projects)
    const qbResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/reports/ProfitAndLoss?summarize_column_by=Classes&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text();
      console.error('QuickBooks API error:', errorText);
      throw new Error(`QuickBooks API error: ${qbResponse.status}`);
    }

    const qbData = await qbResponse.json();
    console.log('Profit & loss by project data received');

    // Process the report data
    const projects: any[] = [];

    // Extract project columns from the report header
    if (qbData.Columns && qbData.Columns.Column) {
      const columns = Array.isArray(qbData.Columns.Column) ? qbData.Columns.Column : [qbData.Columns.Column];
      
      columns.forEach((col: any, idx: number) => {
        if (col.ColTitle && col.ColTitle !== '' && idx > 0) {
          projects.push({
            name: col.ColTitle,
            income: 0,
            expenses: 0,
            netIncome: 0,
            margin: 0,
          });
        }
      });
    }

    // Extract income and expense data from rows
    if (qbData.Rows && qbData.Rows.Row) {
      const rows = Array.isArray(qbData.Rows.Row) ? qbData.Rows.Row : [qbData.Rows.Row];
      
      rows.forEach((row: any) => {
        if (row.Summary && row.ColData) {
          const summaryType = row.Summary.ColData?.[0]?.value || '';
          
          // Check if this is income or expense row
          if (summaryType.toLowerCase().includes('income') || summaryType.toLowerCase().includes('ingreso')) {
            row.ColData.forEach((col: any, idx: number) => {
              if (idx > 0 && projects[idx - 1] && col.value && !isNaN(parseFloat(col.value))) {
                projects[idx - 1].income = parseFloat(col.value);
              }
            });
          } else if (summaryType.toLowerCase().includes('expense') || summaryType.toLowerCase().includes('gasto')) {
            row.ColData.forEach((col: any, idx: number) => {
              if (idx > 0 && projects[idx - 1] && col.value && !isNaN(parseFloat(col.value))) {
                projects[idx - 1].expenses = Math.abs(parseFloat(col.value));
              }
            });
          } else if (summaryType.toLowerCase().includes('net') || summaryType.toLowerCase().includes('neto')) {
            row.ColData.forEach((col: any, idx: number) => {
              if (idx > 0 && projects[idx - 1] && col.value && !isNaN(parseFloat(col.value))) {
                projects[idx - 1].netIncome = parseFloat(col.value);
              }
            });
          }
        }
      });
    }

    // Calculate margins
    projects.forEach(project => {
      if (project.income > 0) {
        project.margin = (project.netIncome / project.income) * 100;
      }
    });

    return new Response(
      JSON.stringify({ projects }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Profit & loss by project error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
