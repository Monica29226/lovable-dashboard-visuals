import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Validate and parse request body
    const body = await req.json();
    const { companyId } = requestSchema.parse(body);

    // Verify user has access to this company
    const { data: access, error: accessError } = await supabase
      .rpc('user_has_company_access', { target_company_id: companyId });

    if (accessError || !access) {
      throw new Error('Access denied to this company');
    }

    // Get token
    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('access_token, realm_id')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('QuickBooks token not found');
    }

    // Query QuickBooks for accounts payable aging report
    const qbResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/reports/AgedPayables?minorversion=65`,
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
    console.log('Accounts payable data received');

    // Process the report data with vendor details
    const processedData = {
      total: 0,
      current: 0,
      overdue: 0,
      vendors: [] as any[]
    };

    // Extract vendor details and totals from the report
    if (qbData.Rows && qbData.Rows.Row) {
      const rows = Array.isArray(qbData.Rows.Row) ? qbData.Rows.Row : [qbData.Rows.Row];
      
      rows.forEach((row: any) => {
        if (row.ColData && row.ColData.length > 0) {
          const vendorName = row.ColData[0]?.value;
          
          // Skip empty rows or summary rows
          if (!vendorName || vendorName.trim() === '' || row.type === 'Section') {
            return;
          }
          
          // Get amounts from columns (typically: vendor name, current, 1-30, 31-60, 61-90, 91+, total)
          const columns = row.ColData.slice(1); // Skip vendor name
          let vendorTotal = 0;
          let vendorCurrent = 0;
          let vendorOverdue = 0;
          
          columns.forEach((col: any, idx: number) => {
            if (col.value && !isNaN(parseFloat(col.value))) {
              const amount = parseFloat(col.value);
              
              // First column after vendor name is current
              if (idx === 0) {
                vendorCurrent += amount;
              } else if (idx < columns.length - 1) {
                // Middle columns are aging buckets (overdue)
                vendorOverdue += amount;
              }
              
              // Last column is typically the total
              if (idx === columns.length - 1) {
                vendorTotal = amount;
              }
            }
          });
          
          if (vendorTotal > 0) {
            processedData.vendors.push({
              name: vendorName,
              total: vendorTotal,
              current: vendorCurrent,
              overdue: vendorOverdue
            });
            
            processedData.total += vendorTotal;
            processedData.current += vendorCurrent;
            processedData.overdue += vendorOverdue;
          }
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
    console.error('Accounts payable error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
