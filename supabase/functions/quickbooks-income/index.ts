import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64Encode(data);
}

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any, company: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Token expiring soon, refreshing...');

    const authString = `${company.client_id}:${company.client_secret}`;
    const authHeader = `Basic ${encodeBase64(authString)}`;

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${JSON.stringify(tokens)}`);
    }

    await supabase
      .from('quickbooks_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('company_id', companyId);

    return tokens.access_token;
  }

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    console.log('Fetching income for company:', companyId);

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id, client_id, client_secret')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      console.error('Company error:', companyError);
      throw new Error('Company not found or not connected');
    }

    console.log('Company found, realm_id:', company.realm_id);

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token error:', tokenError);
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData, company);

    // Get current year dates
    const now = new Date();
    const startDate = `${now.getFullYear()}-01-01`;
    const endDate = now.toISOString().split('T')[0];

    console.log('Fetching P&L from', startDate, 'to', endDate);

    // Fetch with monthly columns
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&summarize_column_by=Month&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QuickBooks API error:', response.status, errorText);
      throw new Error(`Failed to fetch income statement: ${response.status}`);
    }

    const incomeStatement = await response.json();
    console.log('Income statement fetched successfully');

    // Extract column headers (months)
    const columns = incomeStatement.Columns?.Column || [];
    const months = columns.slice(1).map((col: any) => col.ColTitle || col.ColType);
    
    console.log('Months found:', months);

    // Process rows
    const processRow = (row: any) => {
      if (!row || !row.ColData) return null;
      
      const name = row.ColData[0]?.value || '';
      const monthlyValues = row.ColData.slice(1).map((col: any) => {
        const value = parseFloat(col.value || '0');
        return isNaN(value) ? 0 : value;
      });
      
      return {
        name,
        monthlyValues,
        total: monthlyValues.reduce((a, b) => a + b, 0)
      };
    };

    // Extract income and expenses
    let incomeRows: any[] = [];
    let expenseRows: any[] = [];
    let totalIncomeRow: any = null;
    let totalExpensesRow: any = null;
    let netIncomeRow: any = null;

    if (incomeStatement.Rows?.Row) {
      incomeStatement.Rows.Row.forEach((section: any) => {
        if (section.group === 'Income' || section.type === 'Section') {
          if (section.Rows?.Row) {
            section.Rows.Row.forEach((row: any) => {
              if (row.type === 'Data') {
                const processed = processRow(row);
                if (processed && processed.name) {
                  incomeRows.push(processed);
                }
              } else if (row.type === 'Section' && row.Summary) {
                const processed = processRow(row.Summary);
                if (processed) {
                  totalIncomeRow = processed;
                }
              }
            });
          }
          if (section.Summary && section.group === 'Income') {
            totalIncomeRow = processRow(section.Summary);
          }
        } else if (section.group === 'Expenses') {
          if (section.Rows?.Row) {
            section.Rows.Row.forEach((row: any) => {
              if (row.type === 'Data') {
                const processed = processRow(row);
                if (processed && processed.name) {
                  expenseRows.push(processed);
                }
              }
            });
          }
          if (section.Summary) {
            totalExpensesRow = processRow(section.Summary);
          }
        }
      });

      // Net income is usually the last summary row
      const lastRow = incomeStatement.Rows.Row[incomeStatement.Rows.Row.length - 1];
      if (lastRow?.Summary) {
        netIncomeRow = processRow(lastRow.Summary);
      }
    }

    console.log('Processed data - Income rows:', incomeRows.length, 'Expense rows:', expenseRows.length);

    const transformedData = {
      months,
      income: incomeRows,
      expenses: expenseRows,
      totalIncome: totalIncomeRow || { name: 'Total Ingresos', monthlyValues: [], total: 0 },
      totalExpenses: totalExpensesRow || { name: 'Total Gastos', monthlyValues: [], total: 0 },
      netIncome: netIncomeRow || { name: 'Utilidad Neta', monthlyValues: [], total: 0 },
    };

    console.log('Returning data with', months.length, 'months');

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Income fetch error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
