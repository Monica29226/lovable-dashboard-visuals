import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin role directly with the service role client
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('Role verification error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    console.log(`Admin user ${user.email} initiating sync for all companies`);

    // Get all connected companies
    const { data: companies, error: companiesError } = await supabase
      .from('quickbooks_companies')
      .select('id, company_name, is_connected, realm_id')
      .eq('is_connected', true)
      .not('realm_id', 'is', null);

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No connected companies to sync',
          results: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Syncing ${companies.length} companies`);

    const results = [];

    for (const company of companies) {
      console.log(`Syncing company: ${company.company_name}`);
      
      const companyResult = {
        companyId: company.id,
        companyName: company.company_name,
        balanceSheet: { success: false, error: null },
        profitLoss: { success: false, error: null },
        budgets: { success: false, error: null },
      };

      // Sync Balance Sheet
      try {
        const balanceResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/quickbooks-sync-balance`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ companyId: company.id }),
          }
        );

        if (balanceResponse.ok) {
          companyResult.balanceSheet.success = true;
          console.log(`✓ Balance sheet synced for ${company.company_name}`);
        } else {
          const error = await balanceResponse.text();
          companyResult.balanceSheet.error = error;
          console.error(`✗ Balance sheet failed for ${company.company_name}:`, error);
        }
      } catch (error) {
        companyResult.balanceSheet.error = error.message;
        console.error(`✗ Balance sheet error for ${company.company_name}:`, error);
      }

      // Sync Profit/Loss
      try {
        const profitLossResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/quickbooks-sync-profit-loss`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ companyId: company.id }),
          }
        );

        if (profitLossResponse.ok) {
          companyResult.profitLoss.success = true;
          console.log(`✓ Profit/loss synced for ${company.company_name}`);
        } else {
          const error = await profitLossResponse.text();
          companyResult.profitLoss.error = error;
          console.error(`✗ Profit/loss failed for ${company.company_name}:`, error);
        }
      } catch (error) {
        companyResult.profitLoss.error = error.message;
        console.error(`✗ Profit/loss error for ${company.company_name}:`, error);
      }

      // Sync Budgets
      try {
        const budgetsResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/quickbooks-sync-budgets`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ companyId: company.id }),
          }
        );

        if (budgetsResponse.ok) {
          companyResult.budgets.success = true;
          console.log(`✓ Budgets synced for ${company.company_name}`);
        } else {
          const error = await budgetsResponse.text();
          companyResult.budgets.error = error;
          console.error(`✗ Budgets failed for ${company.company_name}:`, error);
        }
      } catch (error) {
        companyResult.budgets.error = error.message;
        console.error(`✗ Budgets error for ${company.company_name}:`, error);
      }

      results.push(companyResult);
    }

    console.log('Sync completed for all companies');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${companies.length} companies`,
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Sync all error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
