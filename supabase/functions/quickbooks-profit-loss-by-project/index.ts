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
    console.log('Processing report columns...');
    const projectColumns: string[] = [];
    
    // Extract project/class columns from header
    if (qbData.Columns?.Column) {
      const columns = Array.isArray(qbData.Columns.Column) ? qbData.Columns.Column : [qbData.Columns.Column];
      console.log(`Found ${columns.length} columns`);
      
      columns.forEach((col: any, idx: number) => {
        if (idx > 0 && col.ColTitle) { // Skip first column (account names)
          projectColumns.push(col.ColTitle);
          console.log(`Column ${idx}: ${col.ColTitle}`);
        }
      });
    }

    console.log(`Total project columns: ${projectColumns.length}`);

    // Initialize project data structure
    const projects = projectColumns.map(name => ({
      name,
      income: 0,
      expenses: 0,
      netIncome: 0,
      margin: 0,
      details: {
        incomeItems: [] as any[],
        expenseItems: [] as any[]
      }
    }));

    // Recursive function to process rows and extract data
    function processRows(rows: any[], level = 0) {
      if (!rows) return;
      
      const rowArray = Array.isArray(rows) ? rows : [rows];
      
      for (const row of rowArray) {
        if (row.type === 'Section' && row.Rows?.Row) {
          const sectionName = row.Header?.ColData?.[0]?.value || '';
          console.log(`${'  '.repeat(level)}Processing section: ${sectionName}`);
          
          // Recursively process subsections
          processRows(row.Rows.Row, level + 1);
          
          // Process section summary if exists
          if (row.Summary?.ColData) {
            const summaryName = sectionName.toLowerCase();
            row.Summary.ColData.forEach((col: any, idx: number) => {
              if (idx > 0 && idx <= projects.length && col.value) {
                const value = parseFloat(col.value.toString().replace(/[^0-9.-]/g, ''));
                if (!isNaN(value)) {
                  if (summaryName.includes('ingreso') || summaryName.includes('income')) {
                    projects[idx - 1].income += value;
                  } else if (summaryName.includes('gasto') || summaryName.includes('expense') || summaryName.includes('cost')) {
                    projects[idx - 1].expenses += Math.abs(value);
                  }
                }
              }
            });
          }
        } else if (row.type === 'Data' && row.ColData) {
          // Process individual data rows
          const itemName = row.ColData[0]?.value || '';
          row.ColData.forEach((col: any, idx: number) => {
            if (idx > 0 && idx <= projects.length && col.value) {
              const value = parseFloat(col.value.toString().replace(/[^0-9.-]/g, ''));
              if (!isNaN(value) && value !== 0) {
                const item = { name: itemName, value };
                if (value > 0) {
                  projects[idx - 1].details.incomeItems.push(item);
                } else {
                  projects[idx - 1].details.expenseItems.push({ ...item, value: Math.abs(value) });
                }
              }
            }
          });
        }
      }
    }

    // Process all rows
    if (qbData.Rows?.Row) {
      console.log('Starting row processing...');
      processRows(qbData.Rows.Row);
    }

    // Calculate net income and margins
    projects.forEach(project => {
      project.netIncome = project.income - project.expenses;
      if (project.income > 0) {
        project.margin = (project.netIncome / project.income) * 100;
      }
      console.log(`Project: ${project.name}, Income: ${project.income}, Expenses: ${project.expenses}, Net: ${project.netIncome}`);
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
