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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get latest tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Not authenticated with QuickBooks');
    }

    // Fetch profit and loss from QuickBooks
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/reports/ProfitAndLoss?minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch income statement');
    }

    const incomeStatement = await response.json();
    
    // Transform data to CRC format
    const transformedData = {
      income: incomeStatement.Rows?.Row?.find((r: any) => r.group === 'Income')?.Rows?.Row?.map((item: any) => ({
        name: item.Header?.ColData?.[0]?.value || '',
        value: parseFloat(item.Summary?.ColData?.[1]?.value || '0'),
      })) || [],
      expenses: incomeStatement.Rows?.Row?.find((r: any) => r.group === 'Expenses')?.Rows?.Row?.map((item: any) => ({
        name: item.Header?.ColData?.[0]?.value || '',
        value: parseFloat(item.Summary?.ColData?.[1]?.value || '0'),
      })) || [],
      totalIncome: parseFloat(incomeStatement.Rows?.Row?.find((r: any) => r.group === 'Income')?.Summary?.ColData?.[1]?.value || '0'),
      totalExpenses: parseFloat(incomeStatement.Rows?.Row?.find((r: any) => r.group === 'Expenses')?.Summary?.ColData?.[1]?.value || '0'),
      netIncome: parseFloat(incomeStatement.Rows?.Row?.find((r: any) => r.type === 'Section' && r.Summary)?.Summary?.ColData?.[1]?.value || '0'),
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
