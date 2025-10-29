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
    console.log('Fetching accounts receivable for company:', companyId);

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

    // Query QuickBooks for accounts receivable aging report
    const qbResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/reports/AgedReceivables?minorversion=65`,
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
    console.log('Accounts receivable data received');

    // Process the report data
    const processedData = {
      total: 0,
      current: 0,
      overdue: 0,
    };

    // Extract totals from the report
    if (qbData.Rows && qbData.Rows.Row) {
      const rows = Array.isArray(qbData.Rows.Row) ? qbData.Rows.Row : [qbData.Rows.Row];
      
      rows.forEach((row: any) => {
        if (row.ColData) {
          // Sum up the amounts from the columns
          row.ColData.forEach((col: any, idx: number) => {
            if (col.value && !isNaN(parseFloat(col.value))) {
              const amount = parseFloat(col.value);
              processedData.total += amount;
              
              // First column after customer name is usually current
              if (idx === 1) {
                processedData.current += amount;
              } else if (idx > 1) {
                processedData.overdue += amount;
              }
            }
          });
        }
      });
    }

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Accounts receivable error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
